# How to run the server (Locally)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file once it's saved without having to re-run.

# Visit our site

Our site is hosted on vercel and can be accessed via the following link http://exam-genie-eta.vercel.app


# To make changes to Exam Genie
## Branching in git

Branch naming convention: feature/homeUI

1. List all the local branches:


      ```
     git branch
      ```
3. Create a new branch and switch to it:

    ```
    git branch <branch name>
    git checkout <branch name>

    or

    git checkout -b <branch name>
    ```
4. Make changes and commit

   ```
   git add .
   git commit -m "message"
   ```
5. Push branch to github
   ```
   git push -u origin <branch name>
   ```
## Pulling changes from main into local branch

1. Make sure local branch is up to date

   ```
   git status
   git add .
   git commit -m "WIP: my changes"   # if you have uncommitted changes
    ```
2. Fetch changes from GitHub

   ```
   git fetch origin
   ```

3. Merge main into current branch

   ```
   git merge origin/main
   ```
