import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productCode: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(0.0001, { message: 'الحجم يجب أن يكون أكبر من صفر' })
  volumeM3: number;

  @IsNumber()
  @Min(1, { message: 'السعر يجب أن يكون أكبر من صفر' })
  pricePerM3: number;

  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty({ message: 'تاريخ الفاتورة مطلوب' })
  date: string;

  @IsString()
  @IsIn(['sale', 'purchase', 'SALE', 'PURCHASE'], { message: 'نوع الفاتورة غير صحيح' })
  type: string;

  @IsString()
  @IsIn(['customer', 'supplier', 'CUSTOMER', 'SUPPLIER'])
  partyType: string;

  @IsString()
  @IsNotEmpty({ message: 'معرّف الطرف مطلوب' })
  partyId: string;

  @IsString()
  @IsNotEmpty()
  partyName: string;

  @IsArray({ message: 'يجب إضافة بند واحد على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber()
  @Min(0)
  totalVolumeM3: number;

  @IsNumber()
  @Min(0, { message: 'إجمالي الفاتورة يجب أن يكون صفر أو أكثر' })
  totalAmount: number;

  @IsNumber()
  @Min(0)
  paidAmount: number;

  @IsNumber()
  @Min(0)
  remainingAmount: number;

  @IsOptional()
  @IsString()
  paymentType?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsString()
  @IsNotEmpty({ message: 'الخزينة مطلوبة' })
  treasuryId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @IsNotEmpty({ message: 'اسم المستخدم مطلوب' })
  createdBy: string;
}
