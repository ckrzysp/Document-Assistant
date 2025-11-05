export const SUPPORTED_LANGS = [
    "English", "Spanish", "French", "German", "Chinese", "Arabic", "Japanese",
];

// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Language selection messages
export const LANG_TRANSLATIONS = {
    "English": {
        processing: "I'll start processing your document now. I'll respond in English...",
        ready: "You can now ask questions about your document in English."
    },
    "Spanish": {
        processing: "Empezaré a procesar tu documento ahora. Responderé en español...",
        ready: "Ahora puedes hacer preguntas sobre tu documento en español."
    },
    "French": {
        processing: "Je vais commencer à traiter votre document maintenant. Je répondrai en français...",
        ready: "Vous pouvez maintenant poser des questions sur votre document en français."
    },
    "German": {
        processing: "Ich beginne jetzt mit der Verarbeitung Ihres Dokuments. Ich werde auf Deutsch antworten...",
        ready: "Sie können nun Fragen zu Ihrem Dokument auf Deutsch stellen."
    },
    "Chinese": {
        processing: "我现在开始处理您的文档。我将用中文回复...",
        ready: "您现在可以用中文询问有关文档的问题。"
    },
    "Arabic": {
        processing: "سأبدأ الآن في معالجة المستند الخاص بك. سأرد بالعربية...",
        ready: "يمكنك الآن طرح أسئلة حول المستند الخاص بك بالعربية."
    },
    "Japanese": {
        processing: "今すぐあなたの文書を処理します。日本語で回答します...",
        ready: "これで日本語で文書に関する質問をすることができます。"
    }
};
