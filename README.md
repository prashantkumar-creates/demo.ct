# Real-Time Chat Application

A modern real-time chat application with room-based messaging, built with React, Node.js, Socket.IO, and MongoDB.

## Features

- **Real-time messaging** with Socket.IO
- **Room-based chat** with unique room IDs
- **Multiple participants** per room
- **Typing indicators** and user presence
- **Message persistence** with MongoDB
- **Responsive design** for all devices
- **Connection status** indicators

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
CLIENT_URL=http://localhost:5173
PORT=3001
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
VITE_SERVER_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

## MongoDB Setup Options

### Option 1: Local MongoDB

1. Install MongoDB on your system
2. Start MongoDB service:
```bash
mongod
```
3. Use connection string: `mongodb://localhost:27017/chatapp`

### Option 2: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string from the "Connect" button
4. Replace `<password>` and `<dbname>` in the connection string
5. Use the full connection string in your `.env` file

Example Atlas connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

### Option 3: MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to your MongoDB instance
3. Create a database named `chatapp`
4. Collections will be created automatically

## Database Schema

The application uses two main collections:

### Messages Collection
```javascript
{
  _id: ObjectId,
  roomId: String,
  sender: String,
  text: String,
  timestamp: Date
}
```

### Rooms Collection
```javascript
{
  _id: ObjectId,
  roomId: String,
  participants: [String],
  createdAt: Date
}
```

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `CLIENT_URL`: Your frontend URL
   - `PORT`: Will be set automatically by the platform

2. Deploy the server directory

### Frontend Deployment (Netlify/Vercel)

1. Set environment variable:
   - `VITE_SERVER_URL`: Your backend server URL

2. Build and deploy:
```bash
npm run build
```

## API Endpoints

- `GET /api/rooms/:roomId` - Get room information
- `GET /api/rooms/:roomId/messages` - Get room messages

## Socket Events

### Client to Server
- `join-room` - Join a chat room
- `send-message` - Send a message
- `typing` - Typing indicator

### Server to Client
- `room-joined` - Successfully joined room
- `new-message` - New message received
- `user-joined` - User joined room
- `user-left` - User left room
- `user-typing` - Typing indicator

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, Mongoose
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Icons**: Lucide React

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request