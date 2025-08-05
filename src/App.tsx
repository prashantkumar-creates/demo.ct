import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Trash2, Clock, Copy, Check, Plus, LogIn, Hash, Wifi, WifiOff } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  roomId: string;
}

interface Room {
  roomId: string;
  participants: string[];
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [inputText, setInputText] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });
     //newly added for deleting
    newSocket.on('room-chat-cleared', () => {
    setMessages([]); // Clear messages in UI
  });

    newSocket.on('room-joined', (data) => {
      setCurrentRoom({ roomId: data.roomId, participants: data.participants });
      setMessages(data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
      setIsJoined(true);
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    });

    newSocket.on('user-joined', (data) => {
      setCurrentRoom(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    newSocket.on('user-left', (data) => {
      setCurrentRoom(prev => prev ? { ...prev, participants: data.participants } : null);
    });

    newSocket.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
      } else {
        setTypingUsers(prev => prev.filter(u => u !== data.username));
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const createRoom = () => {
    if (!username.trim() || !socket) return;
    
    const roomId = generateRoomId();
    socket.emit('join-room', { roomId, username: username.trim() });
  };

  const joinRoom = () => {
    if (!username.trim() || !roomInput.trim() || !socket) return;
    
    const roomId = roomInput.trim().toUpperCase();
    socket.emit('join-room', { roomId, username: username.trim() });
  };

  const sendMessage = () => {
    if (inputText.trim() === '' || !currentRoom || !username.trim() || !socket) return;

    socket.emit('send-message', {
      roomId: currentRoom.roomId,
      sender: username.trim(),
      text: inputText.trim()
    });
    
    setInputText('');
    handleTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleTyping = (typing: boolean) => {
    if (!socket || !currentRoom) return;

    if (typing !== isTyping) {
      setIsTyping(typing);
      socket.emit('typing', {
        roomId: currentRoom.roomId,
        username: username.trim(),
        isTyping: typing
      });
    }

    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 1000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) {
      handleTyping(true);
    } else {
      handleTyping(false);
    }
  };

 const clearChat = () => {
  if (socket && currentRoom) {
    socket.emit('clear-room-chat', { roomId: currentRoom.roomId });
  }
};

  const leaveRoom = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setCurrentRoom(null);
    setMessages([]);
    setIsJoined(false);
    setRoomInput('');
    setTypingUsers([]);
  };

  const copyRoomId = async () => {
    if (currentRoom) {
      await navigator.clipboard.writeText(currentRoom.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getUserColor = (sender: string) => {
    const colors = [
      { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
      { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
      { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
      { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
      { bg: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
    ];
    
    const hash = sender.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Join/Create Room Screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Join Chat Room</h1>
            <p className="text-gray-600">Enter your name and create or join a room</p>
            
            {/* Connection Status */}
            <div className={`flex items-center justify-center space-x-2 mt-4 px-3 py-2 rounded-lg ${
              connected ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {connected ? 'Connected to server' : 'Connecting to server...'}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                maxLength={20}
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={createRoom}
                disabled={!username.trim() || !connected}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  username.trim() && connected
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span>Create New Room</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="Enter room ID..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center font-mono text-lg tracking-wider"
                  maxLength={8}
                />
                <button
                  onClick={joinRoom}
                  disabled={!username.trim() || !roomInput.trim() || !connected}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    username.trim() && roomInput.trim() && connected
                      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <LogIn className="h-5 w-5" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Room Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
              <Hash className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-800">Room {currentRoom?.roomId}</h1>
                <button
                  onClick={copyRoomId}
                  className="p-1 hover:bg-gray-100 rounded transition-colors duration-200"
                  title="Copy room ID"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {currentRoom?.participants.length || 0} participant(s) • {username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={leaveRoom}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Hash className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to Room {currentRoom?.roomId}</h3>
                  <p className="text-gray-500 max-w-md">Share the room ID with others to start chatting. Messages will appear here in real-time.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const userColor = getUserColor(message.sender);
                const isOwnMessage = message.sender === username;
                
                return (
                 <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="max-w-xs lg:max-w-md">
                      <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        {!isOwnMessage && (
                          <>
                            <div className={`w-6 h-6 ${userColor.bg} rounded-full flex items-center justify-center`}>
                              <span className="text-xs font-semibold text-white">
                                {message.sender[0].toUpperCase()}
                              </span>
                            </div>
                            <span className={`text-xs font-medium ${userColor.text}`}>{message.sender}</span>
                          </>
                        )}
                        {isOwnMessage && (
                          <>
                            <span className="text-xs font-medium text-gray-500">You</span>
                            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {message.sender[0].toUpperCase()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                            : `${userColor.light} text-gray-800 border ${userColor.border} rounded-bl-md`
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className={`flex items-center ${isOwnMessage ? 'justify-end' : 'justify-start'} mt-2 space-x-1 ${
                          isOwnMessage ? 'text-blue-100' : userColor.text.replace('600', '400')
                        }`}>
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-xs">
                  <p className="text-sm text-gray-600">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message as ${username}...`}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                maxLength={500}
                disabled={!connected}
              />
              <button
                onClick={sendMessage}
                disabled={inputText.trim() === '' || !connected}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-200 ${
                  inputText.trim() && connected
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between text-xs mt-2 px-2">
            <span className="text-gray-500">
              {connected ? 'Press Enter to send' : 'Connecting...'}
            </span>
            <span className="text-gray-400">{inputText.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;