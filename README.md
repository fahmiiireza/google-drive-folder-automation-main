# Google Drive Folder Automation

This tool automates the creation of a standardized folder and file structure in Google Drive for creative projects. It provides a simple web interface to generate complex, convention-based naming for new projects or variations of existing ones, saving time and eliminating manual errors.

## The Problem It Solves

Manually creating nested folders, scripts, briefs, and source asset folders for every new creative or variation is tedious and prone to inconsistent naming. This tool enforces a strict and logical naming convention automatically, ensuring all project assets are organized, searchable, and linked by a common batch number.

## Features

-   **Automated Folder Creation:** Generates a complete, multi-level folder structure in Google Drive with a single click.
-   **File Generation:** Creates placeholder Google Docs for scripts, briefs, and ad copy.
-   **Dual Workflow:** Supports creating brand-new project packets and creating variations within existing projects.
-   **Enforces Naming Conventions:** Automatically constructs all file and folder names based on a detailed naming system.
-   **Simple Web UI:** An easy-to-use local web form for entering project details.
-   **Extensible:** Includes commented-out code for future integration with Monday.com.

## Prerequisites

-   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
-   A Google Account with Google Drive access.
-   A configured Google Cloud Project with the Drive API enabled.

## Installation & Setup

**1. Clone the repository:**

```bash
git clone https://github.com/jsnescrow/google-drive-folder-automation.git
```

**2. Navigate to the project directory:**

```bash
cd google-drive-folder-automation
```

**3. Install dependencies:**

```bash
npm install
```

## Configuration

Before running the application, you need to configure your credentials and set a default folder.

**1. Set Up Google Credentials**

This tool requires Google API credentials to interact with your Drive.

-   **Follow this detailed SETUP_GUIDE document to obtain your credentials https://docs.google.com/document/d/118Jk--aHgFOqyKeXQP8F5mX4dxV0S-4Q7sX4AWVsRAQ/edit?usp=sharing.**

-   In the project's root directory, create a new file named `.env`.

-   Copy the contents of `.env.example` into your new `.env` file and add your credentials:

    ```env
    # Google Drive API Credentials
    CLIENT_ID=YOUR_CLIENT_ID_HERE
    CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
    REDIRECT_URI=https://developers.google.com/oauthplayground
    REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE

    # Monday.com API Key (Optional)
    MONDAY_API_KEY=YOUR_MONDAY_API_KEY_HERE
    ```

**2. Set Your Default Drive Folder**

To save time, you can set a default parent folder for all *new* projects.

-   Open the `public/index.html` file.
-   Find the `destinationFolderId` input (around line 30).
-   Go to the desired folder in Google Drive and copy its ID from the URL.
-   Paste the ID into the `value` attribute of the input field.

    ```html
    <!-- Before -->
    <input type="text" id="destinationFolderId" value="1xIdbHDj04iCiJS_8s3Y5Jmkh_bHOw42b" />

    <!-- After -->
    <input type="text" id="destinationFolderId" value="YOUR_NEW_FOLDER_ID_HERE" />
    ```

## Usage

**1. Start the server:**

```bash
npm run s
```

This command starts the local server using `nodemon`, which will automatically restart if you make any code changes.

**2. Open the tool:**

Navigate to **[http://localhost:3030](http://localhost:3030)** in your web browser.

**3. Using the Form:**

-   **For a New Project:** Keep the "Is New Project" toggle **ON**. The tool will create a new packet inside the default Destination Folder you configured.
-   **For a Variation:** Turn the "Is New Project" toggle **OFF**. Paste the ID of the existing project packet you want to add to into the "Parent Packet ID" field.

## Naming Convention

This tool is built around a specific naming convention to ensure consistency. The core formula is:

`[Batch #]_[Project ID]-[Parent Creative]_[Variable Tested]-(Context)`

For a complete breakdown of the rules and variable codes, please see this **`NAMING_CONVENTION.md`** document https://docs.google.com/document/d/1S5oFB_4d3Oj_c2L-Xg_4S9sHr0Icuz3TBHrJvOU-oC8/edit?tab=t.0

## License

This project is licensed under the MIT License.
