# 🗨️ Chit-Chat – Real-Time Chat Rooms with Admin Approval

Chit-Chat is a real-time chat web application built using **Node.js, Express, MongoDB, Socket.IO, and EJS**, where users can create chat rooms with unique IDs and control who joins their room via **admin approval**.

---

## 🚀 Features

- 🔐 JWT-based Authentication (stored in cookies)
- 🆔 Create chat rooms with unique Room IDs
- 👑 Room creator automatically becomes Admin
- ⏳ Waiting Room for join requests
- ✅ Admin can Accept or Deny join requests
- 💬 Real-time chat using Socket.IO
- 📜 Persistent chat history using MongoDB
- 👥 Live participants list
- 🖥️ Server-side rendering using EJS

---

## 🏗️ Tech Stack

| Layer | Technology |
|-----|------------|
| Backend | Node.js, Express.js |
| Realtime | Socket.IO |
| Database | MongoDB + Mongoose |
| Frontend | EJS, TailwindCSS |
| Auth | JWT |

---

## 🔄 Application Flow

### 1️⃣ Create Room (Admin)
- User logs in
- Creates a room
- A unique Room ID is generated
- Creator becomes the Admin and a participant
- Redirected directly to the chat room

---

### 2️⃣ Join Room (User)
- User enters Room ID
- If already a participant → joins directly
- Otherwise → added to pending list
- Redirected to the waiting room

---

### 3️⃣ Waiting Room
- User sees “Waiting for Admin Approval”
- Socket remains connected
- No chat access until approved

---

### 4️⃣ Admin Approval
- Admin sees join requests in chat sidebar
- Admin accepts or denies requests
- On Accept:
  - User socket joins the room
  - User redirected to chat room
  - Chat history is sent
  - Participants list updates
- On Deny:
  - User is notified and redirected

---

### 5️⃣ Chatting
- Messages are:
  - Sent in real time
  - Stored in MongoDB
  - Displayed with sender username

---

## 🧠 Important Design Decisions

- Admin is never sent to waiting room
- No duplicate join requests
- No duplicate participants
- Socket joins room before any messages are emitted
- Chat state is always database-driven
