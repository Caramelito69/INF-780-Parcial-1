import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksModule } from '../src/books/books.module';
import { Book } from '../src/books/entities/book.entity';

export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [Book],
        synchronize: true,
        dropSchema: true,
      }),
      BooksModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  
  const dataSource = moduleFixture.get<DataSource>(DataSource);
  
  return { app, dataSource };
}

export async function clearDatabase(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
}
