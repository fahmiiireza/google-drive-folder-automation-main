// imports
import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// express server
const app = express();
const PORT = 3030;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.listen(PORT, () => {
    console.log(`App is listening on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/'));
});


app.post('/api/create-folder', async (req, res) => {
    console.log(req.body);

    // create google oauth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    // set the required scopes
    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN,
    });

    const service = google.drive({
        version: "v3",
        auth: oauth2Client,
    });

    // hard coded req.body variables - these will come from frontend
    const reqBody = {
        packetName: req.body.packetName,
        parentFolderId: req.body.parentFolderId,
        isNew: req.body.isNew,
        batchNum: req.body.batchNum,
        variable: req.body.variable,
        parentCreative: req.body.parentCreative,
        context: req.body.context,
    };

    const task = req.body.assetsToCreate;

    // construct naming conventions for files
    let baseName = `${reqBody.batchNum}_${reqBody.packetName}`;

    if (reqBody.parentCreative) {
        baseName += `-${reqBody.parentCreative}`;
    }

    if (reqBody.context) {
        baseName += `-(${reqBody.context})`;
    }

    if (reqBody.variable) {
        baseName += `_${reqBody.variable}`;
    }

    const adCopyName = `${reqBody.batchNum}_${reqBody.packetName}_AdCopy-(V${reqBody.batchNum})`;

    const finalNames = {
        scriptName: `${baseName}_Script`,
        briefName: `${baseName}_Brief`,
        sourceFolderName: `${baseName}_Source`,
        adCopyName: adCopyName,
        finalVideoFolderName: baseName
    };

    // sub folder names
    const subFolderNames = [
        '01_Briefs_&_Scripts',
        '02_Source_Assets',
        '03_Ad_Copy',
        '04_Finished_Creatives'
    ];

    // create folder function
    async function createFolder(packetName, destinationFolderId) {
        try {
            const folderMetaData = {
                name: packetName,
                parents: [destinationFolderId],
                mimeType: "application/vnd.google-apps.folder",
            };

            const response = await service.files.create({
                requestBody: folderMetaData,
                fields: "id,name,webViewLink",
                supportsAllDrives: true,
            });

            return response.data;
        } catch (error) {
            console.error("Error creating folder:", error.message);
            throw error;
        }
    }

    // create document function
    async function createDocument(name, destinationFolderId) {
        const docMetaData = {
            name,
            parents: [destinationFolderId],
            mimeType: "application/vnd.google-apps.document"
        }

        try {
            const response = await service.files.create({
                requestBody: docMetaData,
                fields: "id,name,webViewLink",
                supportsAllDrives: true,
            });

            return response.data;
        } catch (error) {
            console.error("Error creating document:", error.message);
            throw error;
        }
    }

    // get sub folder ids
    async function getSubFolderIds(parentFolderId) {
        const response = await service.files.list({
            q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: "files(id,name)",
            driveId: "0AHuJHzJ1Qax1Uk9PVA",
            includeItemsFromAllDrives: true,
            corpora: "drive",
            supportsAllDrives: true,
        });

        return response.data.files;
    }

    // monday.com logic
    // async function constructMondayPayload(itemName, googleResponse, isNewCheck) {

    //     const links = {};

    //     for (const item of googleResponse) {
    //         if (item.value.name.endsWith('_Script')) {
    //             links.scriptLink = item.value.webViewLink;
    //         } else if (item.value.name.endsWith('_Brief')) {
    //             links.briefLink = item.value.webViewLink;
    //         } else if (item.value.name.endsWith('_Source')) {
    //             links.sourceAssetLink = item.value.webViewLink;
    //         } else if (item.value.name.includes('_AdCopy-')) {
    //             links.adCopyLink = item.value.webViewLink;
    //         } else {
    //             links.finalVideoLink = item.value.webViewLink;
    //         }
    //     }

    //     // hard coded values for monday.com board 
    //     const SCRIPT_LINK_COLUMN_ID = 'link_mks9gtk0';
    //     const BRIEF_LINK_COLUMN_ID = 'link_mks9bbcq';
    //     const STATUS_COLUMN_ID = 'status__1';
    //     const TYPE_COLUMN_ID = 'dropdown_mks93cxe';
    //     const CREATIVE_LINK_COLUMN_ID = 'link__1';
    //     const AD_COPY_LINK_COLUMN_ID = 'dup__of_creative_link__1';

    //     const typeValue = isNewCheck ? ['New'] : ['Variation (Creative)'];

    //     // // column values for payload
    //     const finalColumnValues = {
    //         [STATUS_COLUMN_ID]: { label: 'Inactive' },
    //         [TYPE_COLUMN_ID]: { labels: typeValue },
    //         ...(links.scriptLink && { [SCRIPT_LINK_COLUMN_ID]: { url: links.scriptLink, text: 'Script' } }),
    //         ...(links.briefLink && { [BRIEF_LINK_COLUMN_ID]: { url: links.briefLink, text: 'Brief' } }),
    //         ...(links.finalVideoLink && { [CREATIVE_LINK_COLUMN_ID]: { url: links.finalVideoLink, text: 'Creatives' } }),
    //         ...(links.adCopyLink && { [AD_COPY_LINK_COLUMN_ID]: { url: links.adCopyLink, text: 'Ad Copy' } }),
    //     };

    //     const mondayPayload = {
    //         query: 'mutation ($itemName: String!, $columnValues: JSON!) { create_item (board_id: 9460530693, group_id: "new_group56241__1", item_name: $itemName, column_values: $columnValues) { id name } }',
    //         variables: {
    //             itemName: itemName,
    //             columnValues: JSON.stringify(finalColumnValues),
    //         },
    //     };
    //     await createMondayItem(mondayPayload)
    // }

    // async function createMondayItem(mondayPayload) {

    //     try {
    //         const response = await axios.post('https://api.monday.com/v2', {
    //             query: mondayPayload.query,
    //             variables: mondayPayload.variables
    //         },
    //             {
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'Authorization': process.env.MONDAY_API_KEY
    //                 }
    //             });
    //         return response
    //     } catch (err) {
    //         console.log('There was an error creating monday item.', err.message)
    //         console.log('Response data:', err.response?.data);
    //     }

    // }

    function buildFileCreationTasks(task, finalNames, folders) {

        const fileCreationTasks = [];

        if (task.script) {
            fileCreationTasks.push(
                createDocument(finalNames.scriptName, folders.briefsandscripts.id)
            );
        }
        if (task.brief) {
            fileCreationTasks.push(
                createDocument(finalNames.briefName, folders.briefsandscripts.id)
            );
        }
        if (task.source) {
            fileCreationTasks.push(
                createFolder(finalNames.sourceFolderName, folders.sourceassets.id)
            );
        }
        if (task.adCopy) {
            fileCreationTasks.push(
                createDocument(finalNames.adCopyName, folders.adcopy.id)
            );
        }
        if (task.finalVideo) {
            fileCreationTasks.push(
                createFolder(finalNames.finalVideoFolderName, folders.finishedcreatives.id)
            );
        }

        return fileCreationTasks

    }

    if (reqBody.isNew) {
        // step 1: create parent packet folder
        const parentData = await createFolder(reqBody.packetName, reqBody.parentFolderId);

        // step 2: create subfolders in parallel
        const subFolderResults = await Promise.allSettled(
            subFolderNames.map(folderName =>
                createFolder(folderName, parentData.id)
            )
        );

        const folders = subFolderResults
            .filter(result => result.status === 'fulfilled')
            .reduce((acc, result) => {
                const match = result.value.name.match(/^(\d+)_(.+)$/);
                if (match) {
                    const [, number, name] = match;
                    const key = name
                        .toLowerCase()
                        .replace(/_&_/g, 'and')
                        .replace(/_/g, '');
                    acc[key] = result.value;
                }
                return acc;
            }, {});
        console.log(folders)

        // step 3: create all files and folders in parallel
        const fileCreationTasks = buildFileCreationTasks(task, finalNames, folders)
        const fileResults = await Promise.allSettled(fileCreationTasks);
        // await constructMondayPayload(finalNames.finalVideoFolderName, fileResults, true)
        res.status(200).json(fileResults);
    } else {
        // get existing subfolder IDs
        const subFolderIds = await getSubFolderIds(reqBody.parentFolderId);
        console.log(subFolderIds)

        const folders = subFolderIds.reduce((acc, folder) => {
            const match = folder.name.match(/^(\d+)_(.+)$/);
            if (match) {
                const [, number, name] = match;
                const key = name
                    .toLowerCase()
                    .replace(/_&_/g, 'and')
                    .replace(/_/g, '');
                acc[key] = {
                    id: folder.id,
                    name: folder.name
                };
            }
            return acc;
        }, {});

        console.log(folders)

        // step 3: create all files and folders in parallel
        const fileCreationTasks = buildFileCreationTasks(task, finalNames, folders)
        const fileResults = await Promise.allSettled(fileCreationTasks);
        // await constructMondayPayload(finalNames.finalVideoFolderName, fileResults, false)
        res.status(200).json(fileResults);
    }


});

