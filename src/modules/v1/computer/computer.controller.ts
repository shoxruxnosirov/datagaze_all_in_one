import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ComputersService } from './computer.service';
// import { Computer } from "./entities/computer.model";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Application, Computer, ComputerForList, ListWithPagination, Role } from 'src/comman/types';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { RolesGuard } from 'src/comman/guards/roles.guard';

@Controller('api/computers')
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Sahifa raqami (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false,
    description: 'Sahifa o‘lchami (default: 10)',
  })
  getAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
  ): Promise<ListWithPagination<ComputerForList>> {
    return this.computersService.getAllComputers(page ?? 1, pageSize ?? 10);
  }

  @Get(':computerId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiParam({
    name: 'computerId',
    type: 'string',
    required: true,
    description: 'Kompyuterning ID si',
  })
  getById(
    @Param('computerId', new ParseUUIDPipe({ version: '4' })) computerId: number,
  ): Promise<Computer> {
    return this.computersService.getComputerById(computerId);
  }

  @Get(':computerId/applications')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kompyuterga tegishli ilovalarni olish' })
  @ApiParam({
    name: 'computerId',
    type: 'string',
    required: true,
    description: 'Kompyuterning ID si',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Sahifa raqami (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: false,
    description: 'Sahifa raqami (default: 10)',
  })
  getApplications(
    @Param('computerId', new ParseUUIDPipe({ version: '4' })) computerId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<ListWithPagination<Application>> {
    return this.computersService.getApplications(computerId, page ?? 1, pageSize ?? 10);
  }
}
