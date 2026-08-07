import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @Min(1, { message: 'مبلغ الدفعة يجب أن يكون أكبر من صفر' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'الخزينة مطلوبة' })
  treasuryId: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
