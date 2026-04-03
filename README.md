# Chatify

Chatify is a full-stack real-time chat application for direct messages and group conversations. It includes authenticated messaging, message requests, group invites, delivery/read states, profile settings, and a responsive chat experience for desktop and mobile.

## Screenshots

**Login**
![Login Page](./screenshots/login.png)

**Signup**
![Signup Page](./screenshots/signup.png)

**Start conversation**
![Start Conversation Page](./screenshots/startConversation.png)

**Chat**
![Chat Page](./screenshots/chatpage.png)

## Features

### Authentication and account

- Sign up and log in with JWT-based authentication
- Persistent auth check on app load
- Secure logout
- Update username from settings
- Change password from settings
- Upload and update profile picture

### Direct messaging

- Real-time 1:1 messaging with Socket.IO
- Send text messages and image messages
- Message request flow for users who are not yet connected
- Accept or reject incoming message requests
- Optimistic message sending for a smoother UI
- Unsend your own messages
- Sidebar chat previews with last message and last activity time
- Search chats by username

### Group chat

- Create groups from selected contacts
- Browse joined groups in a dedicated groups view
- Receive group invites
- Accept or reject group invites
- Open invited groups in a pending state before joining
- Send messages inside groups after accepting the invite
- Add members to groups
- Remove members from groups
- Update group details
- Leave groups
- Group sidebar cards with unread counts and latest activity

### Message state and presence

- Online user presence
- Last seen tracking
- Direct-message delivered state
- Direct-message read state
- Automatic mark-as-read when opening a conversation
- Group read tracking with `readBy`
- Unread badges for chats, requests, and groups

### Contact and moderation tools

- Browse all contacts
- Relationship status labels like connected, request, sent, blocked, and new
- Block users
- Unblock users
- Separate blocked users API support

### User experience

- Responsive layout for desktop and mobile
- Dedicated chats, groups, and contacts navigation
- Empty states for no chats and no groups
- Loading skeletons while data is fetched
- Toast notifications for success and error states

## Tech Stack

### Frontend

- React
- React Router DOM
- Zustand
- Axios
- Socket.IO Client
- React Icons
- React Hot Toast
- React Toastify
- CSS

### Backend

- Node.js
- Express
- Socket.IO
- MongoDB with Mongoose
- JWT authentication
- bcrypt
- cookie-parser
- CORS

### Media and integrations

- Cloudinary for profile image uploads

## Project Structure

```text
chatify/
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── store/
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## API Overview

### Auth routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/check`
- `PUT /api/auth/profile-pic`
- `PUT /api/auth/username`
- `PUT /api/auth/change-password`

### Message routes

- `GET /api/messages/contacts`
- `GET /api/messages/chats`
- `GET /api/messages/requests`
- `GET /api/messages/blocked`
- `GET /api/messages/:id`
- `POST /api/messages/send/:id`
- `POST /api/messages/requests/:id/accept`
- `POST /api/messages/requests/:id/reject`
- `POST /api/messages/read/:id`
- `POST /api/messages/block/:id`
- `POST /api/messages/unblock/:id`
- `DELETE /api/messages/:id`

### Group routes

- `GET /api/groups`
- `GET /api/groups/invites`
- `POST /api/groups`
- `PATCH /api/groups/:id`
- `PATCH /api/groups/:id/members`
- `DELETE /api/groups/:id/members/:memberId`
- `POST /api/groups/:id/leave`
- `POST /api/groups/:id/accept`
- `POST /api/groups/:id/reject`
- `GET /api/groups/:id/messages`
- `POST /api/groups/:id/messages`

## Realtime Events

The app uses Socket.IO for live updates.

### Client listens for

- `newMessage`
- `newGroupMessage`
- `messageUpdated`
- `messageStatusUpdated`
- `userPresenceUpdated`
- `requestAccepted`
- `groupInviteUpdated`
- `onlineUsers`

### Realtime behavior included

- New direct messages and group messages appear without refresh
- Message delivery/read states update live
- Presence changes update live
- Group invite changes sync live
- Pending accepted messages can be marked delivered when the receiver reconnects

## Environment Variables

### Frontend

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Notes:

- If `VITE_API_URL` is missing in development, the frontend falls back to `http://localhost:3000/api`
- If `VITE_SOCKET_URL` is missing, the socket URL is derived from the API origin

### Backend

Create `Backend/.env` with your actual values:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

Add any email-related environment variables your backend setup requires if you are using the email utilities included in the project.

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB database
- Cloudinary account for image uploads

### Install dependencies

From the project root:

```bash
npm install
cd Backend && npm install
cd ../Frontend && npm install
```

### Run the app

Start the backend:

```bash
cd Backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd Frontend
npm run dev
```

Then open the frontend URL shown by Vite, typically:

```text
http://localhost:5173
```

## Usage Flow

1. Create an account or log in.
2. Open the contacts tab to find people.
3. Start a direct conversation or send a first message request.
4. Accept requests to turn pending conversations into active chats.
5. Create groups and invite members.
6. Use the chats and groups views to continue conversations in real time.
7. Manage your account from settings.

## Current Feature Status

Implemented now:

- Direct messaging
- Group chat and invites
- Message requests
- Delivery and read indicators
- Online presence and last seen
- Blocking and unblocking
- Profile picture, username, and password updates
- Responsive chat UI

Potential future improvements:

- Typing indicators
- Message reactions
- File attachments beyond images
- Notifications
- Message search inside a conversation
- Group roles and permissions

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your work
5. Open a pull request


