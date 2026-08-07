import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم المورد مطلوب' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'العنوان مطلوب' })
  address: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
