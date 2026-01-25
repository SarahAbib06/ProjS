// services/archiveSocketService.js
import { archiveController } from "../controllers/archiveController.js";

export const archiveSocketService = {
  configureArchiveSockets: (io) => {
    io.on("connection", (socket) => {
      // 🆕 ÉVÉNEMENT ARCHIVAGE
      socket.on("archive_conversation", async (data) => {
        try {
          const { conversationId } = data;
          const userId = socket.userId;

          await archiveController.archiveConversation(userId, conversationId);

          socket.emit("conversation_archived", {
            success: true,
            conversationId: conversationId,
            timestamp: new Date(),
          });

          console.log(
            `✅ Conversation ${conversationId} archivée par ${userId}`
          );
        } catch (error) {
          socket.emit("archive_error", {
            success: false,
            error: error.message,
          });
        }
      });

      // 🆕 ÉVÉNEMENT DÉSARCHIVAGE
      socket.on("unarchive_conversation", async (data) => {
        try {
          const { conversationId } = data;
          const userId = socket.userId;

          await archiveController.unarchiveConversation(userId, conversationId);

          socket.emit("conversation_unarchived", {
            success: true,
            conversationId: conversationId,
            timestamp: new Date(),
          });

          console.log(
            `✅ Conversation ${conversationId} désarchivée par ${userId}`
          );
        } catch (error) {
          socket.emit("archive_error", {
            success: false,
            error: error.message,
          });
        }
      });

      // 🆕 ÉVÉNEMENT RÉCUPÉRATION ARCHIVÉES
      socket.on("get_archived_conversations", async () => {
        try {
          const userId = socket.userId;
          const archivedConversations =
            await archiveController.getArchivedConversations(userId);

          socket.emit("archived_conversations_data", {
            success: true,
            conversations: archivedConversations,
            count: archivedConversations.length,
          });
        } catch (error) {
          socket.emit("archive_error", {
            success: false,
            error: error.message,
          });
        }
      });
    });
  },
};
