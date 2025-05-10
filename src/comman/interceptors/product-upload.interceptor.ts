import { Injectable } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

@Injectable()
export class FileUploadInterceptor {
  static getInterceptor() {
    return FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'server', maxCount: 1 },
        { name: 'agent', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const baseFolder = './uploads/products/';
            const iconsFolder = './uploads/icons/';

            if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder, { recursive: true });
            if (!fs.existsSync(iconsFolder)) fs.mkdirSync(iconsFolder, { recursive: true });

            let folder = '';
            if (file.fieldname === 'icon') {
              folder = iconsFolder;
            } else if (file.fieldname === 'server') {
              folder = baseFolder;
            } else if (file.fieldname === 'agent') {
              folder = baseFolder;
            }
            cb(null, folder);
          },
          filename: (req, file, cb) => {
            cb(null, file.originalname);
          },
        }),
      },
    );
  }
}
