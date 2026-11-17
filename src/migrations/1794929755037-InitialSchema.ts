import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794929755037 implements MigrationInterface {
  name = 'InitialSchema1794929755037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "history_number" ("patient_id" uuid NOT NULL, "history_number" character varying(25) NOT NULL, CONSTRAINT "PK_ef8cbf72ec5afd7fa69f424830d" PRIMARY KEY ("patient_id", "history_number")); COMMENT ON COLUMN "history_number"."history_number" IS 'Número de historia clínica asignado manualmente por el médico.'`,
    );
    await queryRunner.query(
      `CREATE TABLE "discharge_diagnosis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(20) NOT NULL, "title" character varying(500) NOT NULL, "description" character varying, "discharge_id" uuid NOT NULL, CONSTRAINT "PK_86650ab51971c1ca94cd1f5714f" PRIMARY KEY ("id")); COMMENT ON COLUMN "discharge_diagnosis"."code" IS 'Código usado para las estadisticas del diagnostico de egreso'; COMMENT ON COLUMN "discharge_diagnosis"."title" IS 'Titulo de el diagnostico'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b91df347ab25a1576fbd1dc54a" ON "discharge_diagnosis"  ("discharge_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "discharge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admission_id" uuid NOT NULL, "discharge_date" TIMESTAMP NOT NULL DEFAULT now(), "discharge_exam" character varying NOT NULL, "morbility_status" boolean NOT NULL DEFAULT false, "treatment_plan" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "REL_c4b031ca32f7aa4fb48b92066b" UNIQUE ("admission_id"), CONSTRAINT "PK_2b955d22dec4fd487692d1c5602" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4b031ca32f7aa4fb48b92066b" ON "discharge"  ("admission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "hospital_evolution" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admission_id" uuid NOT NULL, "description" character varying NOT NULL, "date" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "PK_c49241e17cc6d9ab92a88b1427c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fe9878714696b21a021decfc2" ON "hospital_evolution"  ("admission_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."profile_permisions_module_enum" AS ENUM('clinical_records', 'patients', 'statistics')`,
    );
    await queryRunner.query(
      `CREATE TABLE "profile_permisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "module" "public"."profile_permisions_module_enum" NOT NULL, "profile_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b72bd83d1b9c49ba3570315be70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(100) NOT NULL, "description" character varying(100) NOT NULL, "profile_id" uuid NOT NULL, "password" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "status" boolean NOT NULL DEFAULT true, "recovery_code" character varying, "recovery_code_expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patient_gender_enum" AS ENUM('M', 'F')`,
    );
    await queryRunner.query(
      `CREATE TABLE "patient" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document_id" character varying(14) NOT NULL, "names" character varying(100) NOT NULL, "lastnames" character varying(100) NOT NULL, "address" character varying, "gender" "public"."patient_gender_enum" NOT NULL, "birth_year" smallint, "birth_month" smallint, "birth_day" smallint, "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "UQ_b6eb82eeb10fb8624c451d80b72" UNIQUE ("document_id"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id")); COMMENT ON COLUMN "patient"."document_id" IS 'Cédula de identidad venezolana. Ej: 12345678'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_patient_document_id" ON "patient"  ("document_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "admission_diagnosis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(20) NOT NULL, "title" character varying(500) NOT NULL, "description" character varying, "admission_id" uuid NOT NULL, CONSTRAINT "PK_82fc18a388d497619cbd19c720b" PRIMARY KEY ("id")); COMMENT ON COLUMN "admission_diagnosis"."code" IS 'Código usado para las estadisticas del diagnostico de admision'; COMMENT ON COLUMN "admission_diagnosis"."title" IS 'Titulo de el diagnostico'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_040700b1ea85eca27e6482dca5" ON "admission_diagnosis"  ("admission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "admission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "admission_date" TIMESTAMP NOT NULL DEFAULT now(), "consult_reason" character varying array NOT NULL, "current_condition" character varying NOT NULL, "background" character varying array NOT NULL, "admission_exam" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "PK_6e91be345099f3da80fb2cc0d9e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cb0b064e77d2af5ca7a7f691d" ON "admission"  ("patient_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "history_number" ADD CONSTRAINT "FK_f4ea7e6b7b43b0f8d51a83443ef" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge_diagnosis" ADD CONSTRAINT "FK_b91df347ab25a1576fbd1dc54a6" FOREIGN KEY ("discharge_id") REFERENCES "discharge"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge" ADD CONSTRAINT "FK_a0b45e60433975ae4779d34aea0" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge" ADD CONSTRAINT "FK_c4b031ca32f7aa4fb48b92066b6" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital_evolution" ADD CONSTRAINT "FK_0a088c51fb3fd14b18e8fe334b5" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital_evolution" ADD CONSTRAINT "FK_6fe9878714696b21a021decfc20" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_permisions" ADD CONSTRAINT "FK_2a8363305a087684a343a0d63a1" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_f44d0cd18cfd80b0fed7806c3b7" FOREIGN KEY ("profile_id") REFERENCES "profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" ADD CONSTRAINT "FK_ac1d33b19b9a70093396ba02f6e" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_diagnosis" ADD CONSTRAINT "FK_040700b1ea85eca27e6482dca53" FOREIGN KEY ("admission_id") REFERENCES "admission"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission" ADD CONSTRAINT "FK_89882be4f35e3f85663bbffb519" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission" ADD CONSTRAINT "FK_7cb0b064e77d2af5ca7a7f691d2" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admission" DROP CONSTRAINT "FK_7cb0b064e77d2af5ca7a7f691d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission" DROP CONSTRAINT "FK_89882be4f35e3f85663bbffb519"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admission_diagnosis" DROP CONSTRAINT "FK_040700b1ea85eca27e6482dca53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient" DROP CONSTRAINT "FK_ac1d33b19b9a70093396ba02f6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_f44d0cd18cfd80b0fed7806c3b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_permisions" DROP CONSTRAINT "FK_2a8363305a087684a343a0d63a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital_evolution" DROP CONSTRAINT "FK_6fe9878714696b21a021decfc20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hospital_evolution" DROP CONSTRAINT "FK_0a088c51fb3fd14b18e8fe334b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge" DROP CONSTRAINT "FK_c4b031ca32f7aa4fb48b92066b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge" DROP CONSTRAINT "FK_a0b45e60433975ae4779d34aea0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discharge_diagnosis" DROP CONSTRAINT "FK_b91df347ab25a1576fbd1dc54a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "history_number" DROP CONSTRAINT "FK_f4ea7e6b7b43b0f8d51a83443ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cb0b064e77d2af5ca7a7f691d"`,
    );
    await queryRunner.query(`DROP TABLE "admission"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_040700b1ea85eca27e6482dca5"`,
    );
    await queryRunner.query(`DROP TABLE "admission_diagnosis"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_patient_document_id"`);
    await queryRunner.query(`DROP TABLE "patient"`);
    await queryRunner.query(`DROP TYPE "public"."patient_gender_enum"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "profile"`);
    await queryRunner.query(`DROP TABLE "profile_permisions"`);
    await queryRunner.query(
      `DROP TYPE "public"."profile_permisions_module_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6fe9878714696b21a021decfc2"`,
    );
    await queryRunner.query(`DROP TABLE "hospital_evolution"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4b031ca32f7aa4fb48b92066b"`,
    );
    await queryRunner.query(`DROP TABLE "discharge"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b91df347ab25a1576fbd1dc54a"`,
    );
    await queryRunner.query(`DROP TABLE "discharge_diagnosis"`);
    await queryRunner.query(`DROP TABLE "history_number"`);
  }
}
