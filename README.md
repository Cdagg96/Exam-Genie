<div style="position: relative;">
  <h1 style="display: inline;">Exam Genie v1</h1>
  <img src="https://github.com/user-attachments/assets/a3d37804-8f73-4c84-9e30-26eab9313d04" width="102" height="102" style="position: absolute; right: 0; top: 0;" alt="Logo">
</div>

## Client - Nasseef Abukamail
## Team BAGD
Team members
  - Connor Daggett - Team Leader
  - Arjun Bhatia - Document Manager
  - Garrett Ferguson - Release Manager
  - Aidan Rogers - Quality Assurance

## Description

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). In this project, professors and/or students will be able to go into the website and generate full exams. Teachers will also be able to view a list of questions that they have in their database, insert/delete questions/exams in the database, import/export exams, and many more.

Project/Software Deployment Document[GitHub] (https://github.com/senior-design-25-26/bagd/blob/main/docs/installation_doc.md)  
User Manual Project [GitHub] (https://github.com/senior-design-25-26/bagd/blob/main/docs/userman_doc.md)

## Built with (list the technologies used)  
  - Front-end – React, Typescript, next.js

  - Back-end – next.js

  - Database – MongoDB Atlas

  - User-Interface – Tailwind CSS

  - Wireframe software- Figma

  - Email sending- Resend

  - PDF Creator- jsPDF

  - Testing- vitest

## License (if any)
No license asof now

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
