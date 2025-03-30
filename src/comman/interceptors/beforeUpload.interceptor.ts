// import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// import { Observable } from 'rxjs';

// @Injectable()
// export class BeforeUploadInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
//     const req = context.switchToHttp().getRequest();

//     // 🛑 Fayllar yuklanishidan oldin body ni saqlash
//     req.savedBody = { ...req.body };

//     console.log('Interceptor ichida Body:', req.savedBody); // ✅ Shu yerda body chiqishi kerak

//     return next.handle();
//   }
// }
