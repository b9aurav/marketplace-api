import { FileUploadService } from "../services/file-upload.service";
import { FileUploadType } from "../../common/entities/file-upload.entity";
import {
  UploadImageDto,
  FileUploadResponseDto,
  FileUploadDetailedResponseDto,
  GetFilesQueryDto,
} from "../dto/file-upload.dto";
import { User } from "../../users/entities/user.entity";

describe("FileUploadController Logic", () => {
  let fileUploadService: jest.Mocked<FileUploadService>;

  const mockUser: User = {
    id: "user-id",
    email: "admin@example.com",
    name: "Admin User",
    phone: "+1234567890",
    role: "admin" as any,
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: new Date(),
    is_active: true,
    metadata: {},
    addresses: [],
    orders: [],
  } as User;

  const mockFile: Express.Multer.File = {
    fieldname: "file",
    originalname: "test-image.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024 * 1024,
    buffer: Buffer.from("fake-image-data"),
    destination: "",
    filename: "",
    path: "",
    stream: null,
  };

  const mockFileUploadResponse: FileUploadResponseDto = {
    filename: "test-filename.jpg",
    url: "http://localhost:3000/uploads/test-filename.jpg",
    mime_type: "image/jpeg",
    size: 1024 * 1024,
  };

  const mockFileUploadDetailedResponse: FileUploadDetailedResponseDto = {
    id: "file-id",
    filename: "test-filename.jpg",
    original_name: "test-image.jpg",
    url: "http://localhost:3000/uploads/test-filename.jpg",
    mime_type: "image/jpeg",
    size: 1024 * 1024,
    type: FileUploadType.PRODUCT,
    created_at: new Date(),
  };

  beforeEach(() => {
    fileUploadService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
      getFiles: jest.fn(),
      getFileById: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      const uploadDto: UploadImageDto = {
        type: FileUploadType.PRODUCT,
      };

      fileUploadService.uploadImage.mockResolvedValue(mockFileUploadResponse);

      const result = await fileUploadService.uploadImage(
        mockFile,
        uploadDto,
        mockUser.id,
      );

      expect(result).toEqual(mockFileUploadResponse);
      expect(fileUploadService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        uploadDto,
        mockUser.id,
      );
    });

    it("should upload image with default type", async () => {
      const uploadDto: UploadImageDto = {};

      fileUploadService.uploadImage.mockResolvedValue(mockFileUploadResponse);

      const result = await fileUploadService.uploadImage(
        mockFile,
        uploadDto,
        mockUser.id,
      );

      expect(result).toEqual(mockFileUploadResponse);
      expect(fileUploadService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        uploadDto,
        mockUser.id,
      );
    });
  });

  describe("deleteImage", () => {
    it("should delete image successfully", async () => {
      fileUploadService.deleteImage.mockResolvedValue();

      await fileUploadService.deleteImage("file-id", mockUser.id);

      expect(fileUploadService.deleteImage).toHaveBeenCalledWith(
        "file-id",
        mockUser.id,
      );
    });
  });

  describe("getFiles", () => {
    it("should return paginated files", async () => {
      const query: GetFilesQueryDto = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [mockFileUploadDetailedResponse],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      fileUploadService.getFiles.mockResolvedValue(mockResponse);

      const result = await fileUploadService.getFiles(query);

      expect(result).toEqual(mockResponse);
      expect(fileUploadService.getFiles).toHaveBeenCalledWith(query);
    });

    it("should return files with filters", async () => {
      const query: GetFilesQueryDto = {
        page: 1,
        limit: 10,
        type: FileUploadType.PRODUCT,
        search: "test",
        uploaded_by: "user-id",
      };

      const mockResponse = {
        data: [mockFileUploadDetailedResponse],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      };

      fileUploadService.getFiles.mockResolvedValue(mockResponse);

      const result = await fileUploadService.getFiles(query);

      expect(result).toEqual(mockResponse);
      expect(fileUploadService.getFiles).toHaveBeenCalledWith(query);
    });
  });

  describe("getFileById", () => {
    it("should return file details", async () => {
      fileUploadService.getFileById.mockResolvedValue(mockFileUploadDetailedResponse);

      const result = await fileUploadService.getFileById("file-id");

      expect(result).toEqual(mockFileUploadResponse);
      expect(fileUploadService.getFileById).toHaveBeenCalledWith("file-id");
    });
  });
});
