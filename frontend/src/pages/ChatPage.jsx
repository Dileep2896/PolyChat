import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import { getStreamToken } from "../lib/api";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [chatChannel, setChatChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // Ensure authUser is available before fetching
  });

  useEffect(() => {
    const initChat = async () => {
      console.log(tokenData);

      if (!tokenData?.token || !authUser) return;
      try {
        console.log("initializing stream chat client...");
        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChatChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Failed to initialize chat. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (chatChannel) {
      const callUrl = `${window.location.origin}/call/${chatChannel.id}`;
      chatChannel.sendMessage({
        text: `I've started a video call! Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent in chat!");
    }
  };

  if (loading || !chatClient || !chatChannel) {
    return <ChatLoader />;
  }

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={chatChannel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
