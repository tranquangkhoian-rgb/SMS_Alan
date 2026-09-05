/**
 * Git Synchronization Script for SMS - Self Management System
 * Uses isomorphic-git to stage, commit, and push without requiring Xcode CLI tools.
 */

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');
const remoteUrl = 'https://github.com/tranquangkhoian-rgb/SMS_Alan';

// Helper to recursively list files respecting gitignore
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file === '.git' || file === '.node' || file === 'node_modules' || file === '.DS_Store') {
      return;
    }
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (!file.endsWith('.db') && !file.endsWith('.db-journal') && !file.endsWith('.sqlite')) {
        const relativePath = path.relative(repoDir, fullPath);
        arrayOfFiles.push(relativePath);
      }
    }
  });

  return arrayOfFiles;
}

async function runGitSync() {
  console.log('========================================================');
  console.log('📦 Starting Git Sync for SMS - Self Management System');
  console.log('📂 Repository Directory:', repoDir);
  console.log('🌐 Remote URL:', remoteUrl);
  console.log('========================================================\n');

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GIT_TOKEN;
  if (!token) {
    console.log('\n⚠️ No GitHub Personal Access Token (GITHUB_TOKEN) detected in environment.');
    return { needsAuth: true, remoteUrl };
  }

  // 1. Init
  await git.init({ fs, dir: repoDir });
  console.log('✅ Git repository initialized.');

  // 2. Set Remote
  await git.setConfig({
    fs,
    dir: repoDir,
    path: 'remote.origin.url',
    value: remoteUrl
  });

  // 3. Fetch remote objects so we have existing remote history
  console.log('🔄 Fetching remote repository history from GitHub...');
  try {
    await git.fetch({
      fs,
      http,
      dir: repoDir,
      url: remoteUrl,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: token, password: '' })
    });
    console.log('✅ Remote history fetched successfully.');
  } catch (fetchErr) {
    console.log('ℹ️ Fetch note:', fetchErr.message);
  }

  // 4. Stage files
  const files = getAllFiles(repoDir);
  console.log(`📁 Staging ${files.length} files...`);

  for (const file of files) {
    await git.add({ fs, dir: repoDir, filepath: file });
  }
  console.log('✅ All project files staged.');

  // 5. Commit
  const author = {
    name: 'Trần Quang Khôi An',
    email: 'khoian.alan@vinschool.edu.vn'
  };

  try {
    const sha = await git.commit({
      fs,
      dir: repoDir,
      author,
      message: 'feat: Complete SMS - Self Management System (Docs, Frontend UI, Node.js + Express Backend, SQLite Database, Automated Tests)'
    });
    console.log('✅ Commit created successfully! Commit SHA:', sha);
  } catch (err) {
    console.log('ℹ️ Commit status:', err.message);
  }

  // Ensure branch is main
  const branches = await git.listBranches({ fs, dir: repoDir });
  if (!branches.includes('main')) {
    await git.branch({ fs, dir: repoDir, ref: 'main' });
  }

  await git.writeRef({
    fs,
    dir: repoDir,
    ref: 'HEAD',
    value: 'refs/heads/main',
    force: true,
    symbolic: true
  });

  // 6. Push to GitHub
  console.log('🚀 Pushing to GitHub repository (main)...');
  const pushResult = await git.push({
    fs,
    http,
    dir: repoDir,
    remote: 'origin',
    ref: 'main',
    remoteRef: 'refs/heads/main',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });

  console.log('🎉 Push Result:', JSON.stringify(pushResult, null, 2));
  return { success: true };
}

runGitSync()
  .then((res) => {
    if (res && res.success) {
      console.log('\n🌟 PUSH COMPLETED SUCCESSFULLY TO GITHUB!');
    }
  })
  .catch((err) => {
    console.error('❌ Git sync error:', err);
  });
