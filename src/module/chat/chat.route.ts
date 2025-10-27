import { Router } from 'express';
import type { RequestHandler } from 'express';
import multer from 'multer';
import chatController from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

router.get('/shared/:shareLink', chatController.getSharedConversation as RequestHandler);


// All routes below require authentication
router.use(authenticate as RequestHandler);


// Create a new conversation 
router.post('/conversations', chatController.createConversation as RequestHandler);

// Send a message 
router.post(
  '/conversations/:conversationId/messages',
  upload.single('file'),
  chatController.sendMessage as RequestHandler
);

// Get all conversations for the authenticated user
router.get('/conversations', chatController.getConversations as RequestHandler);

// Get all messages in a conversation
router.get('/conversations/:conversationId', chatController.getConversationMessages as RequestHandler);

// Delete a single conversation for the authenticated user

router.delete('/conversations', chatController.deleteConversation as RequestHandler);

// Delete all conversations for the authenticated user
router.delete('/conversations', chatController.deleteAllConversations as RequestHandler);

// Get conversation info (includes mode, documentId, sessionId)
router.get('/conversations/:conversationId/info', chatController.getConversationInfo as RequestHandler);

// Share or unshare a conversation (body: { share: boolean })
router.post('/conversations/:conversationId/share', chatController.shareConversation as RequestHandler);

// Delete a conversation
router.delete('/conversations/:conversationId', chatController.deleteConversation as RequestHandler);

export default router;