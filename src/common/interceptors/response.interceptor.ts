import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Response<T> {
  status: string;
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Extract pagination if it exists
        const pagination = data && data.pagination ? data.pagination : null;
        const responseData = pagination ? data.data : data;

        return {
          status: "success",
          data: responseData,
          message: "",
          ...(pagination && { pagination }),
        };
      }),
    );
  }
}
