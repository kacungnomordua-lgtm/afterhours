const fs = require('fs');
const path = require('path');

const STORIES_FILE = path.join(__dirname, '../data/stories.json');

// Ensure data directory exists
const dataDir = path.dirname(STORIES_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// ===== HELPER: Load all stories =====
function loadStories() {
    try {
        if (fs.existsSync(STORIES_FILE)) {
            return JSON.parse(fs.readFileSync(STORIES_FILE, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('Error loading stories:', error);
        return {};
    }
}

// ===== HELPER: Save all stories =====
function saveStories(stories) {
    try {
        fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving stories:', error);
    }
}

// ===== Get or create active story for guild/channel =====
// Structure:
// {
//   "guildId": {
//     "channelId": {
//       storyId: String,
//       guildId: String,
//       channelId: String,
//       words: [{ text: String, userId: String, userName: String, addedAt: Date }],
//       contributors: { userId: count },
//       rating: Number (1-10),
//       aiComment: String,
//       status: 'active' | 'completed' | 'archived',
//       createdAt: Date,
//       completedAt: Date
//     }
//   }
// }
function getActiveStory(guildId, channelId) {
    const stories = loadStories();
    
    if (!stories[guildId]) {
        stories[guildId] = {};
    }
    
    // Check if active story exists for this channel
    if (stories[guildId][channelId] && stories[guildId][channelId].status === 'active') {
        return stories[guildId][channelId];
    }
    
    // Create new story
    const newStory = {
        storyId: `${guildId}_${channelId}_${Date.now()}`,
        guildId,
        channelId,
        words: [],                    // Array of words with metadata
        contributors: {},             // { userId: count }
        rating: null,                 // AI rating (1-10)
        aiComment: null,              // AI comment about the story
        status: 'active',             // 'active' | 'completed' | 'archived'
        createdAt: new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString()
    };
    
    stories[guildId][channelId] = newStory;
    saveStories(stories);
    
    return newStory;
}

// ===== Add word to story =====
function addWordToStory(guildId, channelId, word, userId, userName) {
    const stories = loadStories();
    
    if (!stories[guildId] || !stories[guildId][channelId]) {
        return null;
    }
    
    const story = stories[guildId][channelId];
    
    // Only add to active stories
    if (story.status !== 'active') {
        return null;
    }
    
    // Add word with metadata
    story.words.push({
        text: word,
        userId,
        userName,
        addedAt: new Date().toISOString()
    });
    
    // Track contributor count
    if (!story.contributors[userId]) {
        story.contributors[userId] = 0;
    }
    story.contributors[userId]++;
    
    story.updatedAt = new Date().toISOString();
    
    saveStories(stories);
    
    return story;
}

// ===== Complete story with AI rating =====
function completeStory(guildId, channelId, rating, aiComment) {
    const stories = loadStories();
    
    if (!stories[guildId] || !stories[guildId][channelId]) {
        return null;
    }
    
    const story = stories[guildId][channelId];
    
    story.status = 'completed';
    story.completedAt = new Date().toISOString();
    story.rating = rating;
    story.aiComment = aiComment;
    
    saveStories(stories);
    
    return story;
}

// ===== Reset story (after completion) =====
function resetStory(guildId, channelId) {
    const stories = loadStories();
    
    if (!stories[guildId] || !stories[guildId][channelId]) {
        return null;
    }
    
    // Archive old story
    const oldStory = stories[guildId][channelId];
    oldStory.status = 'archived';
    
    // Create new empty story
    const newStory = {
        storyId: `${guildId}_${channelId}_${Date.now()}`,
        guildId,
        channelId,
        words: [],
        contributors: {},
        rating: null,
        aiComment: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        completedAt: null,
        updatedAt: new Date().toISOString()
    };
    
    stories[guildId][channelId] = newStory;
    saveStories(stories);
    
    return { oldStory, newStory };
}

// ===== Get story for display =====
function getStory(guildId, channelId) {
    const stories = loadStories();
    
    if (!stories[guildId] || !stories[guildId][channelId]) {
        return null;
    }
    
    return stories[guildId][channelId];
}

// ===== Format story text for display =====
function formatStoryText(story) {
    if (!story || story.words.length === 0) {
        return 'Story belum dimulai...';
    }
    
    return story.words.map(w => w.text).join(' ');
}

module.exports = {
    getActiveStory,
    addWordToStory,
    completeStory,
    resetStory,
    getStory,
    formatStoryText,
    loadStories,
    saveStories
};
