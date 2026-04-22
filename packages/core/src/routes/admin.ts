import { Router, type IRouter } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import {
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
} from '../controllers/contentTypes.js'
import {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../controllers/entries.js'
import { listUsers, createUser, getMe, updateMe, changePassword } from '../controllers/users.js'
import { listApiTokens, createApiToken, deleteApiToken } from '../controllers/apiTokens.js'
import { uploadMedia } from '../controllers/media.js'
import { upload } from '../media/index.js'

const router: IRouter = Router()

router.use(authenticate)

// Content types
router.get('/content-types', authorize('content-types:read'), listContentTypes)
router.post('/content-types', authorize('content-types:write'), createContentType)
router.get('/content-types/:slug', authorize('content-types:read'), getContentType)
router.put('/content-types/:slug', authorize('content-types:write'), updateContentType)
router.delete('/content-types/:slug', authorize('content-types:write'), deleteContentType)

// Entries
router.get('/content-types/:slug/entries', authorize('entries:read'), listEntries)
router.post('/content-types/:slug/entries', authorize('entries:write'), createEntry)
router.get('/entries/:slug/:id', authorize('entries:read'), getEntry)
router.put('/entries/:slug/:id', authorize('entries:write'), updateEntry)
router.delete('/entries/:slug/:id', authorize('entries:write'), deleteEntry)

// Current user profile
router.get('/users/me', getMe)
router.patch('/users/me', updateMe)
router.patch('/users/me/password', changePassword)

// Users
router.get('/users', authorize('users:read'), listUsers)
router.post('/users', authorize('users:write'), createUser)

// API tokens
router.get('/api-tokens', authorize('api-tokens:read'), listApiTokens)
router.post('/api-tokens', authorize('api-tokens:write'), createApiToken)
router.delete('/api-tokens/:id', authorize('api-tokens:write'), deleteApiToken)

// Media
router.post('/media', authorize('media:write'), upload.single('file'), uploadMedia)

export default router
