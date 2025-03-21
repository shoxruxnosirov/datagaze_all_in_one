import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, ParseIntPipe } from "@nestjs/common";
import { ComputersService } from "./computer.service";
// import { Computer } from "./entities/computer.model";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { IApplication } from "../agent/interface/application";
import { IComputer, IComputerForList } from "../agent/interface/computer";

@Controller("api/computers")
export class ComputersController {
  constructor(private readonly computersService: ComputersService) { }

  @Get()
  @ApiQuery({ name: "page", type: Number, required: false, description: "Sahifa raqami (default: 1)" })
  @ApiQuery({ name: "pageSize", type: Number, required: false, description: "Sahifa o‘lchami (default: 10)" })
  getAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number
  ): Promise<{
    data: IComputerForList[],
    currentPage: number,
    totalPages: number,
    totalRecords: number
  }> {
    return this.computersService.getAllComputers(page ?? 1, pageSize ?? 10);
  }
  

  @Get(":computerId")
  @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  getById(@Param("computerId", new ParseUUIDPipe({ version: '4' })) computerId: number) {
    return this.computersService.getComputerById(computerId);
  }

  @Get(":computerId/applications")
  @ApiOperation({ summary: "Kompyuterga tegishli ilovalarni olish" })
  @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  @ApiQuery({ name: "page", type: Number, required: false, description: "Sahifa raqami (default: 1)" })
  @ApiQuery({ name: "pageSize", type: Number, required: false, description: "Sahifa raqami (default: 10)" })
  getApplications(
    @Param("computerId", new ParseUUIDPipe({ version: '4' })) computerId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ data: IApplication[], currentPage: number, totalPages: number, totalRecords: number }> {
    return this.computersService.getApplications(computerId, page ?? 1, pageSize ?? 10);
  }


}
