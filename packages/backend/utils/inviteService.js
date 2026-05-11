import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ALLOWED_EMAILS_PATH = path.join(__dirname, '../../../data/invites/allowed_emails.json');
const ALLOWED_EMAILS_PATH = process.env.ALLOWED_EMAILS_PATH || DEFAULT_ALLOWED_EMAILS_PATH;

function getEnvAllowedEmails() {
    const envAllowlist = process.env.INVITE_ALLOWLIST_EMAILS;
    if (!envAllowlist) {
        return null;
    }

    return envAllowlist
        .split(',')
        .map(email => email.toLowerCase().trim())
        .filter(Boolean);
}

export async function isEmailAllowed(email) {
    try {
        const envEmails = getEnvAllowedEmails();
        if (envEmails) {
            const normalizedEmail = email.toLowerCase().trim();
            return envEmails.includes(normalizedEmail);
        }

        const data = await fs.readFile(ALLOWED_EMAILS_PATH, 'utf8');
        const { emails } = JSON.parse(data);
        
        // Case-insensitive email comparison
        const normalizedEmail = email.toLowerCase().trim();
        return emails.some(allowedEmail => 
            allowedEmail.toLowerCase().trim() === normalizedEmail
        );
    } catch (error) {
        console.error('Error reading allowed emails:', error);
        // If file doesn't exist or can't be read, deny access
        return false;
    }
}

export async function addAllowedEmail(email) {
    try {
        if (getEnvAllowedEmails()) {
            throw new Error('Invite allowlist is managed by INVITE_ALLOWLIST_EMAILS and cannot be modified by file writes');
        }

        const data = await fs.readFile(ALLOWED_EMAILS_PATH, 'utf8');
        const config = JSON.parse(data);
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if email already exists
        if (!config.emails.some(e => e.toLowerCase().trim() === normalizedEmail)) {
            config.emails.push(normalizedEmail);
            await fs.writeFile(ALLOWED_EMAILS_PATH, JSON.stringify(config, null, 2));
        }
    } catch (error) {
        console.error('Error adding allowed email:', error);
        throw error;
    }
}

export async function removeAllowedEmail(email) {
    try {
        if (getEnvAllowedEmails()) {
            throw new Error('Invite allowlist is managed by INVITE_ALLOWLIST_EMAILS and cannot be modified by file writes');
        }

        const data = await fs.readFile(ALLOWED_EMAILS_PATH, 'utf8');
        const config = JSON.parse(data);
        
        const normalizedEmail = email.toLowerCase().trim();
        config.emails = config.emails.filter(e => 
            e.toLowerCase().trim() !== normalizedEmail
        );
        
        await fs.writeFile(ALLOWED_EMAILS_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error removing allowed email:', error);
        throw error;
    }
}

export async function getAllowedEmails() {
    try {
        const envEmails = getEnvAllowedEmails();
        if (envEmails) {
            return envEmails;
        }

        const data = await fs.readFile(ALLOWED_EMAILS_PATH, 'utf8');
        const { emails } = JSON.parse(data);
        return emails;
    } catch (error) {
        console.error('Error reading allowed emails:', error);
        return [];
    }
}
