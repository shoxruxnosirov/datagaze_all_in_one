import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Knex } from "knex";
import { KNEX_CONNECTION } from "src/database/workWithDB/database.module";
import { ApplicationDto } from "src/modules/v1/agent/dto/application";
import { CreateComputerDto } from "src/modules/v1/agent/dto/computer";
import { IApplication } from "src/modules/v1/agent/interface/application";
import { IComputer } from "src/modules/v1/agent/interface/computer";

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

    const applications: (IApplication & { total_records: number })[] = await this.knex("applications")
      .select("computerId", "version", "name", "size", "type", "installed_date")
      .where("computerId", computerId)
      .orderBy("installed_date", "desc")
      .limit(pageSize)
      .offset(offset)
      .select(this.knex.raw("COUNT(*) OVER() as total_records")); // Jami yozuvlar sonini olish

    if (applications.length === 0) {
      return {
        data: [],
        currentPage: page,
        totalPages: 0,
        totalRecords: 0,
      };
    }

    const totalRecords = Number(applications[0].total_records);
    return {
      data: applications,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / pageSize),
      totalRecords,
    };
  }

  async createOrUpdate(computerData: CreateComputerDto): Promise<{ computerId: string, status: string, key: string }> {
    let key = computerData.network_adapters.map(item => item.mac_address).sort().join('_');
    computerData.key = key;

    const dataToInsert = {
      ...computerData,
      network_adapters: JSON.stringify(computerData.network_adapters),
      disks: JSON.stringify(computerData.disks),
    };

    // INSERT yoki UPDATE bo‘lgan satrni tekshirish
    const query = this.knex("computers")
      .insert(dataToInsert)
      .onConflict("key")
      .merge()
      .returning(["id", this.knex.raw("(xmax = 0) AS is_inserted")]); // xmax = 0 bo‘lsa, yangi qo‘shilgan

    const [computer] = await query;
    console.log('computer: ', computer);

    // `is_inserted` = true bo‘lsa, INSERT bo‘lgan, aks holda UPDATE
    const status = computer.is_inserted ? "registered" : "updated";

    return {
      computerId: computer.id,
      key,
      status,
    };
  }

  async applicationRegister(applications: ApplicationDto[], computerId: string): Promise<{ id: string, status: string }[]> {

    const result = await this.knex('applications')
      .insert(applications)
      .onConflict(['computerId', 'name'])
      .merge({
        name: this.knex.raw('EXCLUDED.name'),
        size: this.knex.raw('EXCLUDED.size'),
        type: this.knex.raw('EXCLUDED.type'),
        // installedAt: this.knex.raw('EXCLUDED.installedAt')
      })
      .returning([
        'name',
        this.knex.raw("CASE WHEN xmax = 0 THEN 'registered' ELSE 'updated' END as status")
      ]);


    // console.log('Final Response:', result);
    return result as ({ id: string; status: string }[])
  }


  // async createOrUpdate(computerData: CreateComputerDto): Promise<{ computerId: string, status: string, key: string }> {
  //   let key = computerData.network_adapters.map(item => item.mac_address).sort().join('_');
  //   computerData.key = key;

  //   const dataToInsert = {
  //     ...computerData,
  //     network_adapters: JSON.stringify(computerData.network_adapters), // JSON.stringify() qo‘shamiz
  //     disks: JSON.stringify(computerData.disks),
  //   };

  //   const query = this.knex("computers")
  //     .insert({ ...dataToInsert })
  //     .onConflict("key")
  //     .merge()
  //     .returning(["*", this.knex.raw("xmax as is_updated")]); // PostgreSQL 'xmax' ustuni orqali tekshiramiz

  //   const [computer] = await query;

  //   const isUpdated = computer.is_updated !== 0;

  //   return {
  //     computerId: computer.id,
  //     key,
  //     status: isUpdated ? "updated" : "inserted",
  //   }
  // }



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
