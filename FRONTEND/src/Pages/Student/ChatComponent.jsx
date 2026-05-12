import React, { useState, useEffect, useRef } from 'react';
import './ChatComponent.css';

const ChatComponent = ({ initialTarget }) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // قائمة المحادثات (Sidebar)
  const [chats] = useState([
    { id: 1, name: "Graduation Project Group", type: "group", lastMsg: "We updated the documents...", avatar: "GP", color: "#10B981" },
    { id: 2, name: "Ali Mansour", type: "private", lastMsg: "Thanks doctor!", avatar: "A", color: "#4F46E5" },
    { id: 3, name: "Sara Ahmed", type: "private", lastMsg: "Meeting at 10?", avatar: "S", color: "#9333EA" },
  ]);

  // الشخص أو المجموعة النشطة حالياً
  const [activeChat, setActiveChat] = useState(chats[0]);

  // سجل الرسائل لكل محادثة (مبدئياً للعرض)
  const [messages, setMessages] = useState([
    { id: 1, sender: "Ali Mansour", text: "أهلاً بك يا مهندس، كيف حال المشروع؟", time: "10:30 AM", isMe: false },
    { id: 2, sender: "Me", text: "الحمد لله، الأمور تسير بشكل جيد وبدأنا بتجهيز الواجهات.", time: "10:32 AM", isMe: true },
  ]);

  // --- الربط الذكي ---
  // إذا تغير الـ initialTarget (جاي من صفحة الفريق)، الشات بفتح تلقائياً على هاد الشخص
  useEffect(() => {
    if (initialTarget) {
      const targetChat = chats.find(c => c.name === initialTarget);
      if (targetChat) {
        setActiveChat(targetChat);
        // رسالة ترحيب بسيطة عند الانتقال
        setMessages([
          { id: Date.now(), sender: targetChat.name, text: `مرحباً! لقد انتقلت لمراسلتي من صفحة الفريق.`, time: "الآن", isMe: false }
        ]);
      }
    }
  }, [initialTarget, chats]);

  // تمرير تلقائي لأسفل المحادثة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "Me",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="chat-container">
      {/* القائمة الجانبية */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>المحادثات</h2>
        </div>
        <div className="chat-list">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChat.id === chat.id ? 'active' : ''}`}
              onClick={() => setActiveChat(chat)}
            >
              <div className="chat-avatar" style={{ background: chat.color }}>
                {chat.avatar}
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.name}</div>
                <p className="chat-last-msg">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* منطقة المحادثة الرئيسية */}
      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-user">
            <div className="chat-avatar small" style={{ background: activeChat.color }}>
              {activeChat.avatar}
            </div>
            <div>
              <h3>{activeChat.name}</h3>
              <span className="online-status">متصل الآن</span>
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message-bubble ${msg.isMe ? 'me' : 'other'}`}>
              <p>{msg.text}</p>
              <span className="message-time">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder="اكتب رسالتك هنا..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="send-btn">➤</button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;