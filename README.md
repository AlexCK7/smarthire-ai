# SmartHire AI 🚀

**SmartHire AI** is a smart resume analyzer that helps job seekers understand how well their resume matches top roles in tech. Upload your resume, instantly receive a match score, see your top-fit job role, and track your resume history — all from a clean, modern UI.

---

## 🌟 Features

- 📄 Upload PDF resumes and receive instant match scores  
- 🎯 See top-matched job roles based on keyword/skills analysis  
- 💾 Resume history is saved and persists between sessions (PostgreSQL)  
- 🔁 Refresh and Clear History buttons for easy control  
- 💡 Future plans: AI feedback, premium suggestions, salary insights  

---

## 🧠 Powered By

- **Client:** React + TypeScript + Vite  
- **Server:** Node.js + Express  
- **Database:** Neon PostgreSQL  
- **File Uploads:** `multer`, file parsing logic  
- **AI Matching:** Simple keyword logic (future: GPT-4, LangChain)  

---

## 🛠️ Setup Instructions

1. **Clone the repo:**

```bash
git clone https://github.com/YOUR_USERNAME/smarthire-ai.git
cd smarthire-ai
```

2. **Install dependencies (client & server separately):**

```bash
# For client (frontend)
cd client
npm install

# For server (backend)
cd server
npm install
```

3. **Create .env file inside /server folder:**

```env
PORT=5000
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
```

4. **Run the app locally:**

```bash
# In /client
npm run dev
```

```bash
# In /server
npx ts-node index.ts
```

---

## 📦 Deployment

Coming soon: deploy on Vercel (client) + Render (server). Live link will be added post-deployment.

---

## 👑 Credits

Founded by Taiga, built to empower job seekers globally.  
Open-sourced, free, and always improving.

---

## 📌 License

MIT License. Fork it, use it, improve it.
