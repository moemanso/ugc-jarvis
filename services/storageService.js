// Storage service for managing user files and history
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

export class StorageService {
  constructor() {
    this.baseDir = config.storage.dir;
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = ['uploads', 'outputs', 'history'];
    dirs.forEach(dir => {
      const dirPath = path.join(this.baseDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  getUserDir(userId) {
    const userDir = path.join(this.baseDir, 'outputs', String(userId));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
  }

  saveUpload(userId, fileId, fileData, mediaType) {
    const userDir = path.join(this.baseDir, 'uploads', String(userId));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const ext = mediaType === 'photo' ? 'jpg' : 
                mediaType === 'video' ? 'mp4' : 'bin';
    const fileName = `${fileId}_${Date.now()}.${ext}`;
    const filePath = path.join(userDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(fileData));
    return filePath;
  }

  saveOutput(userId, fileName, data) {
    const userDir = this.getUserDir(userId);
    const filePath = path.join(userDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(data));
    return filePath;
  }

  saveHistory(userId, projectData) {
    const historyFile = path.join(this.baseDir, 'history', `${userId}.json`);
    let history = [];
    
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    }
    
    history.unshift({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...projectData
    });
    
    // Keep only last 20 items
    history = history.slice(0, 20);
    
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    return history;
  }

  getHistory(userId) {
    const historyFile = path.join(this.baseDir, 'history', `${userId}.json`);
    if (!fs.existsSync(historyFile)) {
      return [];
    }
    return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
  }

  getProjectDir(userId, projectId) {
    const projectDir = path.join(this.getUserDir(userId), projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    return projectDir;
  }
}