import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handlePasswordResetRequest', () => {
    it('should throw NOT_IMPLEMENTED exception', async () => {
      const dto: PasswordResetRequestDto = { email: 'test@example.com' };

      let error;
      try {
        await controller.handlePasswordResetRequest(dto);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_IMPLEMENTED);
    });
  });
});
