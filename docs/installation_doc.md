# Project Installation Guide

Follow the steps below to set up your environment and install all required dependencies.

---

## Prerequisites
Before starting, make sure you have **Node.js** and **npm** installed on your system.

---

## Install Node.js

### Windows

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

# Install the latest LTS (Long-Term Support) version of Node.js
nvm install --lts

# Use the installed LTS version
nvm use --lts

```
### Mac
```bash
# Install Node.js using Homebrew
brew install node
```

---

## Install Resend

```bash
npm install resend
```

---

## Install Toast

```bash
npm install react-hot-toast
```

## Install jsPDF

```bash
npm install jspdf
```

## Install for Calendar Component

```bash
npm install @mui/x-date-pickers dayjs

npm install @emotion/react @emotion/styled
```

## Install for Testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

