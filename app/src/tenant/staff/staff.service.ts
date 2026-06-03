import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../infra/prisma/prisma.service'
import { hashPassword } from '../../auth/shared/auth-utils'
import { CreateStaffDto } from './dto/create-staff.dto'
import { UpdateStaffDto } from './dto/update-staff.dto'

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.tenantUser.findMany({
      where: { tenantId },
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(tenantId: string, dto: CreateStaffDto) {
    const existing = await this.prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    })
    if (existing) throw new ConflictException('Já existe um usuário com este email nesta loja')

    const passwordHash = await hashPassword(dto.password)

    return this.prisma.tenantUser.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role ?? 'STAFF',
      },
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, createdAt: true },
    })
  }

  async update(tenantId: string, id: string, dto: UpdateStaffDto) {
    const user = await this.prisma.tenantUser.findFirst({ where: { id, tenantId } })
    if (!user) throw new NotFoundException('Usuário não encontrado')

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.tenantUser.findUnique({
        where: { tenantId_email: { tenantId, email: dto.email } },
      })
      if (existing) throw new ConflictException('Email já está em uso nesta loja')
    }

    const data: Record<string, unknown> = {}
    if (dto.email) data.email = dto.email
    if (dto.name) data.name = dto.name
    if (dto.role) data.role = dto.role
    if (dto.password) data.passwordHash = await hashPassword(dto.password)

    return this.prisma.tenantUser.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, totpEnabled: true, createdAt: true },
    })
  }

  async remove(tenantId: string, id: string) {
    const user = await this.prisma.tenantUser.findFirst({ where: { id, tenantId } })
    if (!user) throw new NotFoundException('Usuário não encontrado')
    if (user.role === 'OWNER') throw new ConflictException('Não é possível remover o proprietário da loja')

    await this.prisma.tenantUser.delete({ where: { id } })
  }
}
