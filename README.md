# ConnectMavai — Real-Time Chat Application

A full-stack real-time chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**.

![Tech Stack](https://img.shields.io/badge/React-Vite-blue) ![Backend](https://img.shields.io/badge/Node.js-Express-green) ![Realtime](https://img.shields.io/badge/Socket.IO-Realtime-yellow) ![Database](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)

## ✨ Features

- 🔐 **JWT Authentication** — Secure registration & login with bcrypt password hashing
- 💬 **Real-time Messaging** — Instant one-to-one private chat via Socket.IO
- ⌨️ **Typing Indicator** — "User is typing..." in real-time
- ✅ **Message Status** — Sent → Delivered → Seen tracking
- 🙂 **Emoji Picker** — Rich emoji support in messages
- 🌙 **Dark Mode** — Toggle between light and dark themes
- 🔒 **E2E Encryption** — AES message encryption (simulation)
- 🟢 **Online/Offline Status** — Real-time presence indicators
- 📜 **Chat History** — Persistent messages in MongoDB with lazy loading
- 🔔 **Push Notifications** — Browser notifications for new messages
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB** running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

---

## 🚀 Setup Instructions

### 1. Clone the project

```bash
cd ConnectMavai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (already provided):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/connectmavai
JWT_SECRET=connectmavai_super_secret_jwt_key_2024
ENCRYPTION_KEY=connectmavai_encryption_key_aes256
```

> ⚠️ **Change `JWT_SECRET` and `ENCRYPTION_KEY`** in production!

Start the backend server:

```bash
node server.js
```

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173** in your browser.

---

## 📂 Project Structure

```
ConnectMavai/
├── backend/
│   ├── controllers/       # Auth & message controllers
│   ├── middleware/         # JWT authentication middleware
│   ├── models/            # User & Message Mongoose schemas
│   ├── routes/            # API route definitions
│   ├── socket/            # Socket.IO event handlers
│   ├── utils/             # Encryption helpers
│   ├── server.js          # Express + Socket.IO entry point
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # Sidebar, ChatWindow, MessageInput, etc.
│   │   ├── context/       # Auth & Socket React contexts
│   │   ├── pages/         # Login, Register, Chat pages
│   │   ├── utils/         # API client, encryption helpers
│   │   ├── App.jsx        # Router & providers
│   │   ├── App.css        # Component styles
│   │   └── index.css      # Design system & CSS variables
│   └── .env               # Frontend environment variables
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint               | Description                  | Auth |
| ------ | ---------------------- | ---------------------------- | ---- |
| POST   | `/api/auth/register`   | Register a new user          | No   |
| POST   | `/api/auth/login`      | Login existing user          | No   |
| GET    | `/api/users`           | Get all users                | Yes  |
| GET    | `/api/messages/:userId`| Get messages (paginated)     | Yes  |
| PUT    | `/api/messages/seen`   | Mark messages as seen        | Yes  |

---

## 🌐 Socket Events

| Event              | Direction    | Description                          |
| ------------------ | ------------ | ------------------------------------ |
| `sendMessage`      | Client → Server | Send a new message                |
| `newMessage`       | Server → Client | Receive a new message             |
| `typing`           | Client → Server | User started typing               |
| `userTyping`       | Server → Client | Notify typing indicator           |
| `stopTyping`       | Client → Server | User stopped typing               |
| `messageSeen`      | Client → Server | Mark messages as seen             |
| `messagesSeen`     | Server → Client | Notify sender messages were seen  |
| `onlineUsers`      | Server → Client | Updated list of online user IDs   |

---

## 📝 License

This project is for educational and portfolio purposes.
