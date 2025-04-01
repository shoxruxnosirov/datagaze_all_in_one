import { Injectable } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
// import { extname } from 'path';
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
            // const { product_name, server_file_version, agent_file_version } = req.savedBody; req.body;

            // console.log('body: ', req.body);

            // Asosiy papkalar
            const baseFolder = './uploads/products/'; // + product_name;
            // const serverFolder = `${baseFolder}/server/${serverVersion}`;
            // const agentFolder = `${baseFolder}/agent/${agentVersion}`;
            const iconsFolder = './uploads/icons/';

            // Kerakli papkalarni yaratish
            if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder, { recursive: true });
            // if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, { recursive: true });
            // if (!fs.existsSync(agentFolder)) fs.mkdirSync(agentFolder, { recursive: true });
            if (!fs.existsSync(iconsFolder)) fs.mkdirSync(iconsFolder, { recursive: true });

            let folder = '';
            if (file.fieldname === 'icon') folder = iconsFolder;
            else if (file.fieldname === 'server')
              folder = baseFolder; //serverFolder;
            else if (file.fieldname === 'agent') folder = baseFolder; //agentFolder;

            cb(null, folder);
          },
          filename: (req, file, cb) => {
            // console.log('body: ', req.body);
            // console.log('file: ', file);
            cb(null, file.originalname); // + extname(file.originalname));
          },
        }),
        // fileFilter: (req, file, cb) => {
        //   // 🔥 Ushbu joyda req.body to'g'ri keladi
        //   console.log('File Filter -> req.body:', req.body);
        //   cb(null, true);
        // },
      },
    );
  }
}
