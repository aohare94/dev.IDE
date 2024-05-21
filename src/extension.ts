import * as vscode from 'vscode';
import { LiveShareClient } from '@microsoft/live-share';
import { app, LiveShareHost } from '@microsoft/teams-js';
import { SharedMap } from 'fluid-framework';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log("Environment Path: ", envPath);
console.log("OpenAI API Key from .env: ", process.env.OPENAI_API_KEY);

// Initialize OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to ensure Teams SDK is initialized
async function ensureTeamsInitialized() {
    try {
        if (!app.isInitialized()) {
            await app.initialize();
            console.log("Microsoft Teams SDK re-initialized.");
        } else {
            console.log("Microsoft Teams SDK already initialized.");
        }
    } catch (error) {
        console.error("Error initializing Microsoft Teams SDK:", error);
        throw new Error("Failed to initialize Microsoft Teams SDK");
    }
}

// Command to start a GPT Live Share session
async function startSession() {
    try {
        await ensureTeamsInitialized();

        const host = LiveShareHost.create();
        const liveShare = new LiveShareClient(host);

        const schema = {
            initialObjects: {
                exampleMap: SharedMap,
            },
        };

        const { container } = await liveShare.joinContainer(schema);

        if (container) {
            vscode.window.showInformationMessage('GPT has joined the Live Share session!');
            maintainConnection(container);
        }
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to join Live Share session: ${error.message}`);
            console.error(`Failed to join Live Share session: ${error.message}`, error);
        } else {
            vscode.window.showErrorMessage('Failed to join Live Share session due to an unknown error.');
            console.error('Failed to join Live Share session due to an unknown error.', error);
        }
    }
}

// Function to maintain the connection and enable GPT to assist
function maintainConnection(container: any) {
    container.on('connected', async (e: { added: Array<{ userId: string }> }) => {
        for (const peer of e.added) {
            if (peer.userId === 'GPT') {
                await assistWithGPT(container);
            }
        }
    });
}

// Function to assist with GPT
async function assistWithGPT(container: any) {
    const documents = container.initialObjects;
    for (const documentId in documents) {
        const document = documents[documentId];
        const content = await document.getContent();
        const gptResponse = await openai.completions.create({
            model: 'gpt-4',
            prompt: `Assist with the following code:\n\n${content}`,
            max_tokens: 25
        });

        document.applyEdits([{
            range: new vscode.Range(0, 0, document.lineCount, 0),
            newText: gptResponse.choices[0].text
        }]);
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('gpt-live-share.startSession', startSession));
}

export function deactivate() {}
