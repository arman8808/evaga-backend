
import express from 'express';
import { createUrl, deleteUrl, getAllPublishedUrls, getAllUrls, getUrlById, updateUrl } from '../controllers/NewsLetter.controller.js';


import { upload } from "../middlewares/multer.middleware.js";
const router = express.Router();


router.get('/getAll',upload().none(), getAllUrls);
router.post('/createOne',upload().none(), createUrl);
router.get('/getone/:id',upload().none(), getUrlById);
router.post('/updateone/:id',upload().none(), updateUrl);
router.delete('/deleteone/:id',upload().none(), deleteUrl);
router.get('/getAllPublishedUrls',upload().none(), getAllPublishedUrls);

export default router;
