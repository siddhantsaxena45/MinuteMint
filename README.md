
# 📋 AI Meeting Notes Summarizer  

An **AI-powered meeting summarizer** built with **Next.js**, **Google Gemini**, and **Nodemailer**.  
Upload transcripts, generate structured summaries, and share via email in just a few clicks.  

***

## 🚀 Features
- ✍️ Upload `.txt` transcripts or paste text directly  
- 🤖 Summarize using **Google Gemini 1.5 Flash**  
- 📝 Extract **action items, decisions, follow-ups, risks**  
- ✏️ Interactive editor to refine AI output  
- 📧 Send summaries via **Gmail SMTP**  
- 🎯 Executive-style bullet point summaries  

***

## 🛠️ Tech Stack
- **Frontend**: Next.js 13+, React, TypeScript  
- **AI Model**: Google **Gemini 1.5 Flash** via `@google/genai`  
- **Backend**: Next.js API Routes (server actions)  
- **Email**: Nodemailer (Gmail with App Passwords)  

***

## ⚙️ Setup & Installation

### 1. Clone Repository  
```bash
git clone https://github.com/your-username/ai-meeting-notes.git
cd ai-meeting-notes
```

### 2. Install Dependencies  
```bash
npm install
```

### 3. Configure Environment Variables  

Create a **.env.local** file in the project root:  

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail SMTP (App Passwords only - not your real password)
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your16charapppassword
GMAIL_FROM="Your Name "
```

🔑 **Secure your Gmail App Password** from [Google Account → Security → App Passwords].  
It should be **16 characters long**.

***

### 4. Run Development Server  
```bash
npm run dev
```

App runs at:  
👉 [http://localhost:3000](http://localhost:3000)

***

## 📡 API Routes

### `/api/summarize`  
- Input: `{ text, instruction }`  
- Output: Structured JSON:  
```json
{
  "summary": "string",
  "action_items": ["string"],
  "decisions": ["string"],
  "follow_ups": ["string"],
  "risks": ["string"]
}
```

### `/api/email`  
- Input: `{ to: [emails], subject, text, html }`  
- Output:  
```json
{ "success": true, "messageId": "..."}
```

***

## 📖 Usage Guide
1. Upload transcript or paste meeting notes  
2. Enter instructions (e.g., _“Summarize in bullet points for executives”_)  
3. Generate AI summary  
4. Review & edit structured sections  
5. Enter recipient emails and hit **Send Email**  

***

## 🛡️ Security Notes
- Use **App Passwords** for Gmail, not your main Google password  
- Always keep `.env.local` out of Git (already ignored by default)  
- Gemini API calls stay server-side (`runtime = "nodejs"`)  

***

## 🧩 Future Improvements
- ✅ Support PDF / DOCX upload  
- ✅ Integration with Google Calendar / Slack  
- ✅ Email scheduling and batch sending  
- ✅ Store summaries in database for team review  


