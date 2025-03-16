import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from "@nestjs/common";
import { ComputersService } from "./computer.service";
import { Computer } from "./entities/computer.model";
import { ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";

@Controller("api/computers")
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Get()
  getAll() {
    return this.computersService.getAllComputers();
  }

  @Get(":id")
  @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  getById(@Param("id", new ParseUUIDPipe({ version: '4' })) id: number) {
    return this.computersService.getComputerById(id);
  }

  @Get(":computerId/applications")
  @ApiOperation({ summary: "Kompyuterga tegishli ilovalarni olish" })
  @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  @ApiQuery({ name: "page", type: Number, required: false, description: "Sahifa raqami (default: 1)" })
  getApplications(@Param("computerId", new ParseUUIDPipe({ version: '4' })) computerId: string, @Query('page') page?: number,) {  
    return this.computersService.getApplications(computerId, page ?? 1);
  }


}
