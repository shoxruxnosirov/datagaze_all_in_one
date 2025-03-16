import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Knex } from "knex";
import { KNEX_CONNECTION } from "src/database/workWithDB/database.module";
import { IApplication } from "src/modules/v1/computer/interface/application";
import { IComputer } from "src/modules/v1/computer/interface/computer";

@Injectable()
export class ComputerRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  async getAllComputers(): Promise<IComputer[]> {
    return await this.knex("computers").select("*");
  }

  async getComputerById(id: number): Promise<IComputer> {
    const computer = await this.knex("computers").where("id", id).first();
    if (!computer) {
      throw new HttpException("Computer not found", HttpStatus.NOT_FOUND);
    }
    return computer;
  }

  async getApplicationsByComputerId(computerId: string, page: number = 1): Promise<{ data: IApplication[], currentPage: number, totalPages: number, totalRecords: number }> {
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const applications: (IApplication & { totalRecords: number })[] = await this.knex("applications")
      .select("id", "computerId", "name", "size", "type", "installedAt")
      .where("computerId", computerId)
      .orderBy("installedAt", "desc")
      .limit(pageSize)
      .offset(offset)
      .select(this.knex.raw("COUNT(*) OVER() as totalRecords")); // Jami yozuvlar sonini olish

    if (applications.length === 0) {
      return {
        data: [],
        currentPage: page,
        totalPages: 0,
        totalRecords: 0,
      };
    }

    const totalRecords = Number(applications[0].totalRecords);
    return {
      data: applications,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / pageSize),
      totalRecords,
    };
  }



  /** Yangi kompyuter qo‘shish */
  // async createComputer(data: any): Promise<{ id: number }> {
  //   const [newComputer] = await this.knex("computers").insert(data).returning(["id"]);
  //   return newComputer;
  // }

  /** Kompyuter ma'lumotlarini yangilash */
  // async updateComputer(id: number, data: any): Promise<{ message: string }> {
  //   const updatedCount = await this.knex("computers").where("id", id).update(data);
  //   if (!updatedCount) {
  //     throw new HttpException("Computer not found", HttpStatus.NOT_FOUND);
  //   }
  //   return { message: "Computer updated successfully" };
  // }

  /** Kompyuterni o‘chirish */
  // async deleteComputer(id: number): Promise<{ message: string }> {
  //   const deletedCount = await this.knex("computers").where("id", id).delete();
  //   if (!deletedCount) {
  //     throw new HttpException("Computer not found", HttpStatus.NOT_FOUND);
  //   }
  //   return { message: "Computer deleted successfully" };
  // }


}
