import { exec } from 'child_process';
import { BrowserWindow, ipcMain } from 'electron';

import { DOCKER_NAME } from './docker';

ipcMain.on('goal.catchup', () => {
  exec(
    `docker exec ${DOCKER_NAME} goal node catchup "$(wget -qO - https://algorand-catchpoints.s3.us-east-2.amazonaws.com/channel/mainnet/latest.catchpoint)"`,
    (err, stdout) =>
      BrowserWindow.getAllWindows()[0]?.webContents.send(
        'goal.catchup',
        err,
        stdout,
      ),
  );
});

ipcMain.on('goal.start', () => {
  exec(`docker exec ${DOCKER_NAME} goal node start`, (err, stdout) =>
    BrowserWindow.getAllWindows()[0]?.webContents.send(
      'goal.start',
      err,
      stdout,
    ),
  );
});

ipcMain.on('goal.status', () => {
  exec(`docker exec ${DOCKER_NAME} goal node status`, (err, stdout) =>
    BrowserWindow.getAllWindows()[0]?.webContents.send(
      'goal.status',
      err,
      stdout,
    ),
  );
});

ipcMain.on('goal.stop', () => {
  exec(`docker exec ${DOCKER_NAME} goal node stop`, (err, stdout) =>
    BrowserWindow.getAllWindows()[0]?.webContents.send(
      'goal.stop',
      err,
      stdout,
    ),
  );
});

ipcMain.on('goal.token', () => {
  exec(`docker exec ${DOCKER_NAME} cat data/algod.admin.token`, (err, stdout) =>
    BrowserWindow.getAllWindows()[0]?.webContents.send(
      'goal.token',
      err,
      stdout,
    ),
  );
});
