import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'bowling-league-tracker';
const REPO_DESCRIPTION = 'Bowling league score tracker with handicap support and AI-powered photo scanning';

async function getAllFiles(dir: string, baseDir: string = dir): Promise<{path: string, content: string}[]> {
  const files: {path: string, content: string}[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.name.startsWith('.') || 
        entry.name === 'node_modules' || 
        entry.name === 'dist' ||
        entry.name === '.replit' ||
        entry.name === 'replit.nix' ||
        entry.name === '.upm' ||
        entry.name === '.cache' ||
        entry.name === '.config') {
      continue;
    }
    
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ path: relativePath, content });
      } catch (e) {
        console.log(`Skipping binary file: ${relativePath}`);
      }
    }
  }
  
  return files;
}

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner: user.login,
        repo: REPO_NAME
      });
      repo = existingRepo;
      console.log(`Repository ${REPO_NAME} already exists`);
    } catch (e: any) {
      if (e.status === 404) {
        console.log(`Creating repository: ${REPO_NAME}`);
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: REPO_NAME,
          description: REPO_DESCRIPTION,
          private: false,
          auto_init: true
        });
        repo = newRepo;
        console.log(`Repository created: ${repo.html_url}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw e;
      }
    }
    
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main'
    });
    const latestCommitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner: user.login,
      repo: REPO_NAME,
      commit_sha: latestCommitSha
    });
    const baseTreeSha = commit.tree.sha;
    
    console.log('Collecting files...');
    const files = await getAllFiles('.');
    console.log(`Found ${files.length} files to upload`);
    
    const treeItems = [];
    for (const file of files) {
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: REPO_NAME,
        content: Buffer.from(file.content).toString('base64'),
        encoding: 'base64'
      });
      
      treeItems.push({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      });
      console.log(`Uploaded: ${file.path}`);
    }
    
    const { data: newTree } = await octokit.git.createTree({
      owner: user.login,
      repo: REPO_NAME,
      base_tree: baseTreeSha,
      tree: treeItems
    });
    
    const { data: newCommit } = await octokit.git.createCommit({
      owner: user.login,
      repo: REPO_NAME,
      message: 'Initial commit from Replit - Bowling League Score Tracker',
      tree: newTree.sha,
      parents: [latestCommitSha]
    });
    
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: newCommit.sha
    });
    
    console.log(`\nSuccess! Your code has been pushed to: ${repo.html_url}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
