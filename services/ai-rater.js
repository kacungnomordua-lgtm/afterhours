const axios = require('axios');

/**
 * AI Rater untuk One Word Story
 * Bisa pakai OpenAI API atau rule-based rating
 * 
 * Input: storyText (string), wordCount, contributorCount
 * Output: { rating (1-10), comment (string), source (openai|rules) }
 */

// ===== MAIN: Rate Story (Auto pick AI or Rules) =====
async function rateStory(storyText, wordCount, contributorCount) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (OPENAI_API_KEY) {
        return await rateWithOpenAI(storyText, wordCount, contributorCount);
    } else {
        return rateWithRules(storyText, wordCount, contributorCount);
    }
}

// ===== OPENAI RATING (Jika ada API key) =====
async function rateWithOpenAI(storyText, wordCount, contributorCount) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Kamu adalah netizen Indonesia yang lagi nge-rant panjang tentang cerita kolaboratif "One Word Story". 
Tulis komentar humor absurd dengan gaya santai dan full slang Indonesia. Struktur kalimatnya panjang-panjang, mengalir kaya lagi mikir sambil ngetik. 
Campur beberapa topik random yang gak berhubungan (kehidupan sehari-hari, makanan, game, agama, atau kejadian random).
Tambahkan pertanyaan retoris yang terdengar konyol dan analogi yang terlalu literal buat humor absurd.
Gunakan nada heran, sedikit menyindir, tapi tetap santai dan random seperti shitpost internet.

Berikan rating 4-10 dan komentar panjang dalam format ini:
RATING: [angka 4-10]
COMMENT: [komentar gaya netizen rant 3-5 kalimat]`
                    },
                    {
                        role: 'user',
                        content: `Cerita dengan ${wordCount} kata dari ${contributorCount} kontributor:\n"${storyText}"`
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const text = response.data.choices[0].message.content;
        const ratingMatch = text.match(/RATING:\s*(\d+(?:\.\d+)?)/i);
        const commentMatch = text.match(/COMMENT:\s*(.+?)(?=\n|$)/is);
        
        let rating = 7;
        let comment = 'Gue gak tau mau bilang apa, tapi cerita lu lumayan sih... kek nasi goreng yang gak pake bawang, ada tapi kurang complete gitu lo.';
        
        if (ratingMatch) {
            rating = Math.max(4, Math.min(10, parseFloat(ratingMatch[1])));
        }
        
        if (commentMatch) {
            comment = commentMatch[1].trim().substring(0, 500);
        }
        
        return {
            rating: parseFloat(rating.toFixed(1)),
            comment,
            source: 'openai'
        };
        
    } catch (error) {
        console.error('OpenAI error:', error.message);
        return rateWithRules(storyText, wordCount, contributorCount);
    }
}

// ===== RULE-BASED RATING (Tanpa API) =====
function rateWithRules(storyText, wordCount, contributorCount) {
    let rating = 7;
    
    // Faktor 1: Panjang cerita (4-20 kata optimal)
    if (wordCount < 4) {
        rating -= 2;
    } else if (wordCount >= 4 && wordCount <= 20) {
        rating += 1.5;
    } else if (wordCount > 20) {
        rating += 0.5;
    }
    
    // Faktor 2: Diversity contributor
    if (contributorCount < 3) {
        rating -= 1.5;
    } else if (contributorCount >= 5 && contributorCount <= 10) {
        rating += 1.5;
    } else if (contributorCount > 10) {
        rating += 1;
    }
    
    // Faktor 3: Keunikan kata
    const words = storyText.split(' ');
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueRatio = uniqueWords.size / words.length;
    if (uniqueRatio > 0.75) {
        rating += 1;
    }
    
    // Clamp rating 4-10
    rating = Math.max(4, Math.min(10, rating));
    rating = parseFloat(rating.toFixed(1));
    
    const comment = generateComment(storyText, wordCount, contributorCount, rating);
    
    return {
        rating,
        comment,
        source: 'rule-based'
    };
}

// ===== GENERATE COMMENT BASED ON RATING (Gaya Netizen Rant Absurd) =====
function generateComment(storyText, wordCount, contributorCount, rating) {
    const commentBank = {
        excellent: [
            `Yo ini cerita lu lumayan banget sih gue harus akuin, ${wordCount} kata dari ${contributorCount} orang tapi flow-nya smooth kaya minum es teh pas lagi panas-panasan, gue sih bilang ini karya masterpiece dari kolaborasi spontan... mungkin karena gue lagi enak tidurnya jadi semuanya terasa lebih bagus, atau emang lu tuh punya talent tersembunyi yang gak pernah kebongkar? Anyway kolaborasi kayak gini bikin gue inget waktu main game kolaboratif sama temen-temen tapi yang ini lebih meaningful gitu, seriously impressive.`,
            
            `Gue gak percaya ini hasil kolaborasi ${contributorCount} orang secara random gini lo, ceritanya ${wordCount} kata tapi terasa panjang banget... entah itu karena enak dibaca atau gue sedang dalam kondisi mental yang sangat bagus, tapi yang jelas ini kaya nasi goreng yang pas banget raciknya, ada nasi, ada telur, ada bumbu, semuanya combine jadi satu kesatuan yang indah, kaya apa sih ini... spiritual experience?`,
            
            `Wa'alaikumsalam cerita lu ini adalah bukti nyata bahwa kolaborasi spontan bisa menghasilkan karya yang lumayan luar biasa, ${contributorCount} kontributor dengan ${wordCount} kata tapi bahasanya kok enak banget dikonsulin... gue sih seneng aja lihat orang-orang bisa berkumpul dan bikin sesuatu yang meaningful tanpa harus semua orang agree sebelumnya, ini kaya kebangkitan seni modern gitu lah.`,
            
            `Bruh ini cerita lu seriously bikin gue speechless, bukan karena gue gak bisa ngomong tapi lebih karena gue lagi iseng scroll dan tiba-tiba ngeliat masterpiece collaboratif seperti ini muncul, ${contributorCount} orang dengan ${wordCount} kata dan hasilnya smooth kayak mentega yang terkena matahari, gue pengen ini dijadiin novel serius atau minimal jadiin bukti bahwa internet bisa menghasilkan karya seni yang bernilai.`
        ],
        good: [
            `Okay jadi gue baca cerita lu ini sambil minum kopi pagi dan gue harus bilang ini lumayan sih, ${contributorCount} orang collaborate dengan ${wordCount} kata dan hasilnya gak begitu berantakan, walaupun kadang ada bagian yang kaya nutup kiri buka kanan gitu tapi overall cerita lu bisa dinikmati... kaya pasta gak mahal di warung tapi surprisingly enak, lo tahu maksud gue kan?`,
            
            `Cerita lu ini solid banget considering it's a collab dari ${contributorCount} orang yang mungkin gak saling kenal, ada karakter random, ada plot twist yang unexpected, ada momen yang bikin gue paham dan ada momen yang bikin gue confusion tapi yang penting overall cerita lu successfully membuat gue spend 5 menit membaca sesuatu yang gak meaningless... so yeah thumbs up lah brow.`,
            
            `Ya ampun cerita lu ini kaya... kayak pas gue lagi scroll memegang ponsel dengan satu tangan sambil makan bakso dengan tangan yang lain dan tiba-tiba bagian yang gue baca ini buat gue tertawa kecil, ${wordCount} kata dari ${contributorCount} kontributor dan somehow ini cukup entertaining untuk standar collab spontan di internet yang biasanya cenderung chaos... nice effort guys seriously.`,
            
            `Hmm cerita lu ini gue kasih value 7-8 dari 10 karena honestly speaking cerita collaborative dari ${contributorCount} orang emang biasanya kacau banget tapi lu guys somehow bisa manage flow-nya dengan decent, ${wordCount} kata mungkin bukan yang paling banyak tapi kualitasnya ada gitu lah, kaya roti tawar yang sebenarnya plain tapi somehow kalo dikombinasikan sama teman-teman (pun intended) jadi lebih menarik.`
        ],
        average: [
            `Alright jadi gue baca cerita ini dan gue sedikit confused with the direction tapi gak masalah, ${contributorCount} orang dengan ${wordCount} kata dan hasilnya... so-so lah honestly, ada potential tapi kayak missing something gitu, kaya mie instan yang lupa dimasukin telur dan sayur, technically it's edible but feels incomplete, coba lagi dengan lebih fokus jangan terbang-terbang mikiran lo.`,
            
            `Jadi ${wordCount} kata dari ${contributorCount} orang ini termasuk okay-okay aja sih, gue gak bakal bilang buruk karena hei at least lu guys effort untuk collab tapi gue juga gak bisa bilang itu masterpiece, it's kaya... kaya nonton film yang mediocre banget, ada scene yang bagus, ada scene yang bikin lo pengen cepet-cepetan aja, final rating: cukup lah, keep trying.`,
            
            `Cerita lu ini feel like ketika gue lagi bobo lalu ada suara tapi gue gak completely awake jadi gue cuma terdengar separuh-separuh... ${contributorCount} kontributor tried their best dengan ${wordCount} kata, structure-nya ada tapi flow-nya like kena potengan misterius di tengah jalan, gue sih encourage lu continue experimenting, maybe next time akan lebih kohesif dan purposeful aja.`,
            
            `Look gue appreciate effort lu dan ${contributorCount-1} orang lainnya untuk make this collaborative story dengan ${wordCount} kata tapi honestly ini terasa kaya kamu guys lagi freestyle tanpa direction yang jelas, ada bagian yang nice, ada bagian yang gue skip mental, tapi overall cerita ini teaching moment yang good that collaboration needs some planning.`
        ],
        minimum: [
            `Okay so gue baca cerita lu ini dengan open mind tapi gue harus honest, ${wordCount} kata dari ${contributorCount} orang ini terasa like ketika gue lagi half asleep dan gue try type something tapi jari-jari gue gak cooperate, cerita ini existence-nya itself is questionable but hey at least you guys tried, maybe kalau next time lebih focused dan less chaotic akan lebih bagus... good luck bro.`,
            
            `Jadi gue gak tau harus bilang apa tentang cerita ini, ${contributorCount} orang collaborate dengan ${wordCount} kata dan hasilnya... let's just say this is a learning experience ya, cerita lu ini kaya attempt pertama gue masankin sesuatu di dapur, technically semua ada tapi hasilnya gak begitu edible... tapi hey everyone starts somewhere right?`,
            
            `Gue honest aja gue struggle untuk understand apa maksud cerita lu ini, ${wordCount} kata dari ${contributorCount} kontributor tapi direction-nya kaya scattered ke semua tempat gitu, ini bukan buruk-buruk amat sih just needs... direction? focus? maybe communication lebih baik antar kontributor? anyway respect untuk effort kalian semua.`,
            
            `Look cerita ${wordCount} kata dari ${contributorCount} orang ini... how do I say this... ini kaya ketika lu order makanan tapi kasirnya salah input, hasil akhirnya gak sama dengan ekspektasi tapi it still technically food? Anyway maybe collab next time dengan lebih clear structure akan membantu produce something yang lebih resonant.`
        ]
    };
    
    let category;
    if (rating >= 8.5) {
        category = 'excellent';
    } else if (rating >= 7) {
        category = 'good';
    } else if (rating >= 5) {
        category = 'average';
    } else {
        category = 'minimum';
    }
    
    const comments = commentBank[category];
    return comments[Math.floor(Math.random() * comments.length)];
}

// ===== PUBLIC FUNCTION: Score Complete Story Object =====
async function scoreStory(storyObject) {
    /**
     * storyObject structure:
     * {
     *   words: [{ text, userId, userName, addedAt }, ...],
     *   contributors: { userId: count, ... },
     *   ...
     * }
     */
    
    const storyText = storyObject.words.map(w => w.text).join(' ');
    const wordCount = storyObject.words.length;
    const contributorCount = Object.keys(storyObject.contributors).length;
    
    const result = await rateStory(storyText, wordCount, contributorCount);
    
    return {
        ...result,
        wordCount,
        contributorCount,
        storyText
    };
}

module.exports = {
    rateStory,
    scoreStory,
    rateWithOpenAI,
    rateWithRules
};
