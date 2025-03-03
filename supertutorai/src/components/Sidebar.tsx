import { useState, useEffect } from "react";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  AcademicCapIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
  }[];
}

interface SidebarProps {
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onUpdateTitle: (chatId: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  currentChatId: string | null;
  chatSessions: ChatSession[];
}

const Sidebar = ({
  onNewChat,
  onSelectChat,
  onUpdateTitle,
  onDeleteChat,
  currentChatId,
  chatSessions,
}: SidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close mobile sidebar when window is resized to desktop
  useEffect(() => {
    if (windowWidth >= 768) {
      setIsMobileOpen(false);
    }
  }, [windowWidth]);

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(id);
    if (windowWidth < 768) setIsMobileOpen(false);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleTitleEdit = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const handleTitleSave = (chatId: string) => {
    if (editTitle.trim()) {
      onUpdateTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
    setEditTitle("");
  };

  return (
    <>
      {/* Mobile sidebar toggle button */}
      {windowWidth < 768 && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed bottom-4 left-4 z-20 bg-blue-500 text-white p-3 rounded-full shadow-lg md:hidden"
        >
          {isMobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`h-full flex flex-col bg-gray-50 ${
          windowWidth < 768
            ? isMobileOpen
              ? "fixed inset-y-0 left-0 z-10 w-64 shadow-lg transform translate-x-0 transition-transform duration-300 ease-in-out"
              : "fixed inset-y-0 left-0 z-10 w-64 shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out"
            : "w-full"
        }`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {chatSessions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No chats yet. Start a new conversation!</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {chatSessions.map((chat) => (
                <li key={chat.id}>
                  {editingChatId === chat.id ? (
                    <div className="flex items-center p-2 rounded-lg bg-white shadow">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        autoFocus
                        onBlur={() => handleTitleSave(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleTitleSave(chat.id);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                        currentChatId === chat.id
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => onSelectChat(chat.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium truncate"
                          onDoubleClick={() =>
                            handleTitleEdit(chat.id, chat.title)
                          }
                        >
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(chat.createdAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteChat(chat.id, e)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                        title="Delete chat"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
