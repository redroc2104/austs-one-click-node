// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { createStoreBindings } from 'electron-persist-secure/lib/bindings';

// we keep a registry of all pending IPC events with their corresponding callbacks
let ipcRegistry: Record<string, any> = {};
function sendIPC<T = any>(
  eventName: string,
  { stderr, stdout, ...options }: any = {},
) {
  return new Promise<T>((resolve, reject) => {
    // make sure we only ever have one listener for each event
    if (!ipcRegistry[eventName]) {
      ipcRenderer.on(eventName, (_: any, err: any, result: any) =>
        ipcRegistry[eventName](err, result),
      );

      // handle buffers
      ipcRenderer.on(
        `${eventName}.stderr`,
        (_: any, err: any) =>
          ipcRegistry[eventName].stderr && ipcRegistry[eventName].stderr(err),
      );
      ipcRenderer.on(
        `${eventName}.stdout`,
        (_: any, __: any, result: any) =>
          ipcRegistry[eventName].stdout &&
          ipcRegistry[eventName].stdout(result),
      );
    } else if (!ipcRegistry[eventName].fired) {
      // if the event has been registered but not fired, reject the previous promise
      ipcRegistry[eventName].reject(
        new Error(`Event ${eventName} was re-registered before it was fired.`),
      );
    }

    ipcRegistry[eventName] = (err: any, result: any) => {
      ipcRegistry[eventName].fired = true;
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    };

    ipcRegistry[eventName].fired = false;
    ipcRegistry[eventName].reject = reject;
    ipcRegistry[eventName].stderr = stderr;
    ipcRegistry[eventName].stdout = stdout;

    ipcRenderer.send(eventName, options);
  });
}

const electron = {
  maximize: () => sendIPC('maximize'),
  maximized: () => sendIPC('maximized'),
  minimize: () => sendIPC('minimize'),
  platform: () => sendIPC('platform'),
  refresh: () => sendIPC('refresh'),
  quit: () => sendIPC('quit'),
  setStartup: (startup: boolean) => sendIPC('setStartup', { startup }),
  unmaximize: () => sendIPC('unmaximize'),
};

const goal = {
  addpartkey: (
    { account, firstValid, lastValid } = {
      account: '',
      firstValid: 0,
      lastValid: 0,
    },
  ) =>
    sendIPC('goal.addpartkey', {
      account,
      firstValid,
      lastValid,
    }),
  catchpoint: () => sendIPC('goal.catchpoint'),
  catchup: (catchpoint: string) => sendIPC('goal.catchup', { catchpoint }),
  deletepartkey: (id: string) => sendIPC('goal.deletepartkey', { id }),
  running: () => sendIPC('goal.running'),
  start: () => sendIPC('goal.start'),
  status: () => sendIPC('goal.status'),
  stop: () => sendIPC('goal.stop'),
  telemetry: (nodeName: string) => sendIPC('goal.telemetry', { nodeName }),
  token: () => sendIPC('goal.token'),
};

let windowIndex: number | undefined;
let windowIndexCallback: (index: number) => void;

ipcRenderer.on('window.index', (_, { index }) => {
  windowIndex = index;
  if (windowIndexCallback) {
    windowIndexCallback(index);
  }
});

const store = createStoreBindings('config');

contextBridge.exposeInMainWorld('electron', electron);
contextBridge.exposeInMainWorld('isDev', () => sendIPC('isDev'));
contextBridge.exposeInMainWorld('goal', goal);
contextBridge.exposeInMainWorld('newWindow', () => sendIPC('newWindow'));
contextBridge.exposeInMainWorld(
  'setIndexCallback',
  (callback: typeof windowIndexCallback) => {
    windowIndexCallback = callback;
    if (windowIndex !== undefined) {
      callback(windowIndex);
    }
  },
);
contextBridge.exposeInMainWorld('store', store);

declare global {
  interface Window {
    electron: typeof electron;
    isDev: () => Promise<boolean>;
    goal: typeof goal;
    newWindow: () => void;
    setIndexCallback: (callback: typeof windowIndexCallback) => void;
    store: typeof store;
  }
}
