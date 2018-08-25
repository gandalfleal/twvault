﻿using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace TW.Vault.Scaffold
{
    public partial class VaultContext : DbContext
    {
        public VaultContext()
        {
        }

        public VaultContext(DbContextOptions<VaultContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Ally> Ally { get; set; }
        public virtual DbSet<Command> Command { get; set; }
        public virtual DbSet<CommandArmy> CommandArmy { get; set; }
        public virtual DbSet<ConflictingDataRecord> ConflictingDataRecord { get; set; }
        public virtual DbSet<Conquer> Conquer { get; set; }
        public virtual DbSet<CurrentArmy> CurrentArmy { get; set; }
        public virtual DbSet<CurrentBuilding> CurrentBuilding { get; set; }
        public virtual DbSet<CurrentPlayer> CurrentPlayer { get; set; }
        public virtual DbSet<CurrentVillage> CurrentVillage { get; set; }
        public virtual DbSet<FailedAuthorizationRecord> FailedAuthorizationRecord { get; set; }
        public virtual DbSet<InvalidDataRecord> InvalidDataRecord { get; set; }
        public virtual DbSet<PerformanceRecord> PerformanceRecord { get; set; }
        public virtual DbSet<Player> Player { get; set; }
        public virtual DbSet<Report> Report { get; set; }
        public virtual DbSet<ReportArmy> ReportArmy { get; set; }
        public virtual DbSet<ReportBuilding> ReportBuilding { get; set; }
        public virtual DbSet<Transaction> Transaction { get; set; }
        public virtual DbSet<User> User { get; set; }
        public virtual DbSet<UserLog> UserLog { get; set; }
        public virtual DbSet<UserUploadHistory> UserUploadHistory { get; set; }
        public virtual DbSet<Village> Village { get; set; }
        public virtual DbSet<World> World { get; set; }
        public virtual DbSet<WorldSettings> WorldSettings { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. See http://go.microsoft.com/fwlink/?LinkId=723263 for guidance on storing connection strings.
                optionsBuilder.UseNpgsql("Host=192.168.1.250; Port=22342; Database=vault_dev; Username=twu_vault; Password=!!TWV@ult4Us??");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<Ally>(entity =>
            {
                entity.HasKey(e => e.TribeId);

                entity.ToTable("ally", "tw_provided");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_ally_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.TribeId)
                    .HasColumnName("tribe_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.AllPoints).HasColumnName("all_points");

                entity.Property(e => e.Members).HasColumnName("members");

                entity.Property(e => e.Points).HasColumnName("points");

                entity.Property(e => e.Tag)
                    .HasColumnName("tag")
                    .HasColumnType("character varying");

                entity.Property(e => e.TribeName)
                    .HasColumnName("tribe_name")
                    .HasColumnType("character varying");

                entity.Property(e => e.TribeRank).HasColumnName("tribe_rank");

                entity.Property(e => e.Villages).HasColumnName("villages");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Ally)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<Command>(entity =>
            {
                entity.ToTable("command", "tw");

                entity.HasIndex(e => e.ArmyId)
                    .HasName("fki_fk_army_id");

                entity.Property(e => e.CommandId)
                    .HasColumnName("command_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.ArmyId).HasColumnName("army_id");

                entity.Property(e => e.FirstSeenAt).HasColumnName("first_seen_at");

                entity.Property(e => e.IsAttack).HasColumnName("is_attack");

                entity.Property(e => e.IsReturning).HasColumnName("is_returning");

                entity.Property(e => e.LandsAt).HasColumnName("lands_at");

                entity.Property(e => e.SourcePlayerId).HasColumnName("source_player_id");

                entity.Property(e => e.SourceVillageId).HasColumnName("source_village_id");

                entity.Property(e => e.TargetPlayerId).HasColumnName("target_player_id");

                entity.Property(e => e.TargetVillageId).HasColumnName("target_village_id");

                entity.Property(e => e.TroopType)
                    .HasColumnName("troop_type")
                    .HasColumnType("character varying");

                entity.Property(e => e.TxId).HasColumnName("tx_id");

                entity.Property(e => e.UserLabel)
                    .HasColumnName("user_label")
                    .HasMaxLength(128);

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.Army)
                    .WithMany(p => p.Command)
                    .HasForeignKey(d => d.ArmyId)
                    .HasConstraintName("fk_army_id");

                entity.HasOne(d => d.SourcePlayer)
                    .WithMany(p => p.CommandSourcePlayer)
                    .HasForeignKey(d => d.SourcePlayerId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_source_player_id");

                entity.HasOne(d => d.SourceVillage)
                    .WithMany(p => p.CommandSourceVillage)
                    .HasForeignKey(d => d.SourceVillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_source_village_id");

                entity.HasOne(d => d.TargetPlayer)
                    .WithMany(p => p.CommandTargetPlayer)
                    .HasForeignKey(d => d.TargetPlayerId)
                    .HasConstraintName("fk_target_player_id");

                entity.HasOne(d => d.TargetVillage)
                    .WithMany(p => p.CommandTargetVillage)
                    .HasForeignKey(d => d.TargetVillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_target_village_id");

                entity.HasOne(d => d.Tx)
                    .WithMany(p => p.Command)
                    .HasForeignKey(d => d.TxId)
                    .HasConstraintName("fk_tx_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Command)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<CommandArmy>(entity =>
            {
                entity.HasKey(e => e.ArmyId);

                entity.ToTable("command_army", "tw");

                entity.Property(e => e.ArmyId)
                    .HasColumnName("army_id")
                    .HasDefaultValueSql("nextval('tw.command_army_id_seq'::regclass)");

                entity.Property(e => e.Archer).HasColumnName("archer");

                entity.Property(e => e.Axe).HasColumnName("axe");

                entity.Property(e => e.Catapult).HasColumnName("catapult");

                entity.Property(e => e.Heavy).HasColumnName("heavy");

                entity.Property(e => e.Knight).HasColumnName("knight");

                entity.Property(e => e.Light).HasColumnName("light");

                entity.Property(e => e.Marcher).HasColumnName("marcher");

                entity.Property(e => e.Militia).HasColumnName("militia");

                entity.Property(e => e.Ram).HasColumnName("ram");

                entity.Property(e => e.Snob).HasColumnName("snob");

                entity.Property(e => e.Spear).HasColumnName("spear");

                entity.Property(e => e.Spy).HasColumnName("spy");

                entity.Property(e => e.Sword).HasColumnName("sword");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.CommandArmy)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<ConflictingDataRecord>(entity =>
            {
                entity.ToTable("conflicting_data_record", "security");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('security.conflicting_data_record_id_seq'::regclass)");

                entity.Property(e => e.ConflictingTxId).HasColumnName("conflicting_tx_id");

                entity.Property(e => e.OldTxId).HasColumnName("old_tx_id");

                entity.HasOne(d => d.ConflictingTx)
                    .WithMany(p => p.ConflictingDataRecordConflictingTx)
                    .HasForeignKey(d => d.ConflictingTxId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_conflicting_tx_id");

                entity.HasOne(d => d.OldTx)
                    .WithMany(p => p.ConflictingDataRecordOldTx)
                    .HasForeignKey(d => d.OldTxId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_old_tx_id");
            });

            modelBuilder.Entity<Conquer>(entity =>
            {
                entity.HasKey(e => e.VaultId);

                entity.ToTable("conquer", "tw_provided");

                entity.Property(e => e.VaultId)
                    .HasColumnName("vault_id")
                    .HasDefaultValueSql("nextval('tw_provided.conquers_vault_id_seq'::regclass)");

                entity.Property(e => e.NewOwner).HasColumnName("new_owner");

                entity.Property(e => e.OldOwner).HasColumnName("old_owner");

                entity.Property(e => e.UnixTimestamp).HasColumnName("unix_timestamp");

                entity.Property(e => e.VillageId).HasColumnName("village_id");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Conquer)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<CurrentArmy>(entity =>
            {
                entity.HasKey(e => e.ArmyId);

                entity.ToTable("current_army", "tw");

                entity.Property(e => e.ArmyId)
                    .HasColumnName("army_id")
                    .UseNpgsqlIdentityByDefaultColumn();

                entity.Property(e => e.Archer).HasColumnName("archer");

                entity.Property(e => e.Axe).HasColumnName("axe");

                entity.Property(e => e.Catapult).HasColumnName("catapult");

                entity.Property(e => e.Heavy).HasColumnName("heavy");

                entity.Property(e => e.Knight).HasColumnName("knight");

                entity.Property(e => e.LastUpdated).HasColumnName("last_updated");

                entity.Property(e => e.Light).HasColumnName("light");

                entity.Property(e => e.Marcher).HasColumnName("marcher");

                entity.Property(e => e.Militia).HasColumnName("militia");

                entity.Property(e => e.Ram).HasColumnName("ram");

                entity.Property(e => e.Snob).HasColumnName("snob");

                entity.Property(e => e.Spear).HasColumnName("spear");

                entity.Property(e => e.Spy).HasColumnName("spy");

                entity.Property(e => e.Sword).HasColumnName("sword");

                entity.Property(e => e.WorldId).HasColumnName("world_id");
            });

            modelBuilder.Entity<CurrentBuilding>(entity =>
            {
                entity.HasKey(e => e.VillageId);

                entity.ToTable("current_building", "tw");

                entity.Property(e => e.VillageId)
                    .HasColumnName("village_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.Barracks).HasColumnName("barracks");

                entity.Property(e => e.Church).HasColumnName("church");

                entity.Property(e => e.Farm).HasColumnName("farm");

                entity.Property(e => e.FirstChurch).HasColumnName("first_church");

                entity.Property(e => e.Garage).HasColumnName("garage");

                entity.Property(e => e.Hide).HasColumnName("hide");

                entity.Property(e => e.Iron).HasColumnName("iron");

                entity.Property(e => e.LastUpdated).HasColumnName("last_updated");

                entity.Property(e => e.Main).HasColumnName("main");

                entity.Property(e => e.Market).HasColumnName("market");

                entity.Property(e => e.Place).HasColumnName("place");

                entity.Property(e => e.Smith).HasColumnName("smith");

                entity.Property(e => e.Snob).HasColumnName("snob");

                entity.Property(e => e.Stable).HasColumnName("stable");

                entity.Property(e => e.Statue).HasColumnName("statue");

                entity.Property(e => e.Stone).HasColumnName("stone");

                entity.Property(e => e.Storage).HasColumnName("storage");

                entity.Property(e => e.Wall).HasColumnName("wall");

                entity.Property(e => e.Watchtower).HasColumnName("watchtower");

                entity.Property(e => e.Wood).HasColumnName("wood");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.Village)
                    .WithOne(p => p.CurrentBuilding)
                    .HasForeignKey<CurrentBuilding>(d => d.VillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("buildings_villages_fk");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.CurrentBuilding)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<CurrentPlayer>(entity =>
            {
                entity.HasKey(e => e.PlayerId);

                entity.ToTable("current_player", "tw");

                entity.Property(e => e.PlayerId)
                    .HasColumnName("player_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.CurrentPossibleNobles).HasColumnName("current_possible_nobles");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.CurrentPlayer)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<CurrentVillage>(entity =>
            {
                entity.HasKey(e => e.VillageId);

                entity.ToTable("current_village", "tw");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_current_village_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.VillageId)
                    .HasColumnName("village_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.ArmyOwnedId).HasColumnName("army_owned_id");

                entity.Property(e => e.ArmyRecentLossesId).HasColumnName("army_recent_losses_id");

                entity.Property(e => e.ArmyStationedId).HasColumnName("army_stationed_id");

                entity.Property(e => e.ArmyTravelingId).HasColumnName("army_traveling_id");

                entity.Property(e => e.Loyalty).HasColumnName("loyalty");

                entity.Property(e => e.LoyaltyLastUpdated).HasColumnName("loyalty_last_updated");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.ArmyOwned)
                    .WithMany(p => p.CurrentVillageArmyOwned)
                    .HasForeignKey(d => d.ArmyOwnedId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("fk_owned_army");

                entity.HasOne(d => d.ArmyRecentLosses)
                    .WithMany(p => p.CurrentVillageArmyRecentLosses)
                    .HasForeignKey(d => d.ArmyRecentLossesId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("current_village_current_army_fk");

                entity.HasOne(d => d.ArmyStationed)
                    .WithMany(p => p.CurrentVillageArmyStationed)
                    .HasForeignKey(d => d.ArmyStationedId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("fk_stationed_army");

                entity.HasOne(d => d.ArmyTraveling)
                    .WithMany(p => p.CurrentVillageArmyTraveling)
                    .HasForeignKey(d => d.ArmyTravelingId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("fk_traveling_army");

                entity.HasOne(d => d.Village)
                    .WithOne(p => p.CurrentVillage)
                    .HasForeignKey<CurrentVillage>(d => d.VillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_village_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.CurrentVillage)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<FailedAuthorizationRecord>(entity =>
            {
                entity.ToTable("failed_authorization_record", "security");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('tw.failed_auth_id_seq'::regclass)");

                entity.Property(e => e.Ip)
                    .IsRequired()
                    .HasColumnName("ip");

                entity.Property(e => e.OccurredAt).HasColumnName("occurred_at");

                entity.Property(e => e.PlayerId).HasColumnName("player_id");

                entity.Property(e => e.Reason)
                    .IsRequired()
                    .HasColumnName("reason")
                    .HasMaxLength(100);

                entity.Property(e => e.RequestedEndpoint)
                    .IsRequired()
                    .HasColumnName("requested_endpoint")
                    .HasMaxLength(64);

                entity.Property(e => e.TribeId).HasColumnName("tribe_id");

                entity.Property(e => e.WorldId).HasColumnName("world_id");
            });

            modelBuilder.Entity<InvalidDataRecord>(entity =>
            {
                entity.ToTable("invalid_data_record", "security");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('security.invalid_data_record_id_seq'::regclass)");

                entity.Property(e => e.DataString).HasColumnName("data_string");

                entity.Property(e => e.Endpoint)
                    .IsRequired()
                    .HasColumnName("endpoint")
                    .HasMaxLength(128);

                entity.Property(e => e.Reason)
                    .IsRequired()
                    .HasColumnName("reason")
                    .HasMaxLength(128);

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.InvalidDataRecord)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("fk_user_id");
            });

            modelBuilder.Entity<PerformanceRecord>(entity =>
            {
                entity.ToTable("performance_record", "tw");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('tw.performance_record_id_seq'::regclass)");

                entity.Property(e => e.AverageTime).HasColumnName("average_time");

                entity.Property(e => e.GeneratedAt).HasColumnName("generated_at");

                entity.Property(e => e.MaxTime).HasColumnName("max_time");

                entity.Property(e => e.MinTime).HasColumnName("min_time");

                entity.Property(e => e.NumSamples).HasColumnName("num_samples");

                entity.Property(e => e.OperationLabel)
                    .IsRequired()
                    .HasColumnName("operation_label")
                    .HasMaxLength(128);
            });

            modelBuilder.Entity<Player>(entity =>
            {
                entity.ToTable("player", "tw_provided");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_player_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.PlayerId)
                    .HasColumnName("player_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.PlayerName)
                    .HasColumnName("player_name")
                    .HasColumnType("character varying");

                entity.Property(e => e.PlayerRank).HasColumnName("player_rank");

                entity.Property(e => e.Points).HasColumnName("points");

                entity.Property(e => e.TribeId).HasColumnName("tribe_id");

                entity.Property(e => e.Villages).HasColumnName("villages");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Player)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<Report>(entity =>
            {
                entity.ToTable("report", "tw");

                entity.HasIndex(e => e.AttackerPlayerId)
                    .HasName("idx_report_attacker_player_id")
                    .ForNpgsqlHasMethod("hash");

                entity.HasIndex(e => e.AttackerVillageId)
                    .HasName("idx_report_attacker_village_id")
                    .ForNpgsqlHasMethod("hash");

                entity.HasIndex(e => e.BuildingId)
                    .HasName("fki_fk_building_id");

                entity.HasIndex(e => e.DefenderPlayerId)
                    .HasName("idx_report_defender_player_id")
                    .ForNpgsqlHasMethod("hash");

                entity.HasIndex(e => e.DefenderVillageId)
                    .HasName("idx_report_defender_village_id")
                    .ForNpgsqlHasMethod("hash");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_report_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.ReportId)
                    .HasColumnName("report_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.AttackerArmyId).HasColumnName("attacker_army_id");

                entity.Property(e => e.AttackerLossesArmyId).HasColumnName("attacker_losses_army_id");

                entity.Property(e => e.AttackerPlayerId).HasColumnName("attacker_player_id");

                entity.Property(e => e.AttackerVillageId).HasColumnName("attacker_village_id");

                entity.Property(e => e.BuildingId).HasColumnName("building_id");

                entity.Property(e => e.DefenderArmyId).HasColumnName("defender_army_id");

                entity.Property(e => e.DefenderLossesArmyId).HasColumnName("defender_losses_army_id");

                entity.Property(e => e.DefenderPlayerId).HasColumnName("defender_player_id");

                entity.Property(e => e.DefenderTravelingArmyId).HasColumnName("defender_traveling_army_id");

                entity.Property(e => e.DefenderVillageId).HasColumnName("defender_village_id");

                entity.Property(e => e.Loyalty).HasColumnName("loyalty");

                entity.Property(e => e.Luck).HasColumnName("luck");

                entity.Property(e => e.Morale).HasColumnName("morale");

                entity.Property(e => e.OccuredAt).HasColumnName("occured_at");

                entity.Property(e => e.TxId).HasColumnName("tx_id");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.AttackerArmy)
                    .WithMany(p => p.ReportAttackerArmy)
                    .HasForeignKey(d => d.AttackerArmyId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_attacker_army_id");

                entity.HasOne(d => d.AttackerLossesArmy)
                    .WithMany(p => p.ReportAttackerLossesArmy)
                    .HasForeignKey(d => d.AttackerLossesArmyId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_attacker_army_losses_id");

                entity.HasOne(d => d.AttackerPlayer)
                    .WithMany(p => p.ReportAttackerPlayer)
                    .HasForeignKey(d => d.AttackerPlayerId)
                    .HasConstraintName("fk_attacker_player_id");

                entity.HasOne(d => d.AttackerVillage)
                    .WithMany(p => p.ReportAttackerVillage)
                    .HasForeignKey(d => d.AttackerVillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_attacker_village_id");

                entity.HasOne(d => d.Building)
                    .WithMany(p => p.Report)
                    .HasForeignKey(d => d.BuildingId)
                    .HasConstraintName("fk_building_id");

                entity.HasOne(d => d.DefenderArmy)
                    .WithMany(p => p.ReportDefenderArmy)
                    .HasForeignKey(d => d.DefenderArmyId)
                    .HasConstraintName("fk_defender_army_id");

                entity.HasOne(d => d.DefenderLossesArmy)
                    .WithMany(p => p.ReportDefenderLossesArmy)
                    .HasForeignKey(d => d.DefenderLossesArmyId)
                    .HasConstraintName("fk_defender_army_losses_id");

                entity.HasOne(d => d.DefenderPlayer)
                    .WithMany(p => p.ReportDefenderPlayer)
                    .HasForeignKey(d => d.DefenderPlayerId)
                    .HasConstraintName("fk_defender_player_id");

                entity.HasOne(d => d.DefenderTravelingArmy)
                    .WithMany(p => p.ReportDefenderTravelingArmy)
                    .HasForeignKey(d => d.DefenderTravelingArmyId)
                    .HasConstraintName("fk_defender_traveling_army_id");

                entity.HasOne(d => d.DefenderVillage)
                    .WithMany(p => p.ReportDefenderVillage)
                    .HasForeignKey(d => d.DefenderVillageId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_defender_village_id");

                entity.HasOne(d => d.Tx)
                    .WithMany(p => p.Report)
                    .HasForeignKey(d => d.TxId)
                    .HasConstraintName("fk_tx_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Report)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<ReportArmy>(entity =>
            {
                entity.HasKey(e => e.ArmyId);

                entity.ToTable("report_army", "tw");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_report_army_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.ArmyId)
                    .HasColumnName("army_id")
                    .HasDefaultValueSql("nextval('tw.report_armies_army_id_seq'::regclass)");

                entity.Property(e => e.Archer).HasColumnName("archer");

                entity.Property(e => e.Axe).HasColumnName("axe");

                entity.Property(e => e.Catapult).HasColumnName("catapult");

                entity.Property(e => e.Heavy).HasColumnName("heavy");

                entity.Property(e => e.Knight).HasColumnName("knight");

                entity.Property(e => e.Light).HasColumnName("light");

                entity.Property(e => e.Marcher).HasColumnName("marcher");

                entity.Property(e => e.Militia).HasColumnName("militia");

                entity.Property(e => e.Ram).HasColumnName("ram");

                entity.Property(e => e.Snob).HasColumnName("snob");

                entity.Property(e => e.Spear).HasColumnName("spear");

                entity.Property(e => e.Spy).HasColumnName("spy");

                entity.Property(e => e.Sword).HasColumnName("sword");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.ReportArmy)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<ReportBuilding>(entity =>
            {
                entity.ToTable("report_building", "tw");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_report_building_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.ReportBuildingId)
                    .HasColumnName("report_building_id")
                    .HasDefaultValueSql("nextval('tw.report_building_report_building_id_seq'::regclass)");

                entity.Property(e => e.Barracks).HasColumnName("barracks");

                entity.Property(e => e.Church).HasColumnName("church");

                entity.Property(e => e.Farm).HasColumnName("farm");

                entity.Property(e => e.FirstChurch).HasColumnName("first_church");

                entity.Property(e => e.Garage).HasColumnName("garage");

                entity.Property(e => e.Hide).HasColumnName("hide");

                entity.Property(e => e.Iron).HasColumnName("iron");

                entity.Property(e => e.Main).HasColumnName("main");

                entity.Property(e => e.Market).HasColumnName("market");

                entity.Property(e => e.Place).HasColumnName("place");

                entity.Property(e => e.Smith).HasColumnName("smith");

                entity.Property(e => e.Snob).HasColumnName("snob");

                entity.Property(e => e.Stable).HasColumnName("stable");

                entity.Property(e => e.Statue).HasColumnName("statue");

                entity.Property(e => e.Stone).HasColumnName("stone");

                entity.Property(e => e.Storage).HasColumnName("storage");

                entity.Property(e => e.Wall).HasColumnName("wall");

                entity.Property(e => e.Watchtower).HasColumnName("watchtower");

                entity.Property(e => e.Wood).HasColumnName("wood");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.ReportBuilding)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<Transaction>(entity =>
            {
                entity.HasKey(e => e.TxId);

                entity.ToTable("transaction", "security");

                entity.Property(e => e.TxId)
                    .HasColumnName("tx_id")
                    .HasDefaultValueSql("nextval('tw.tx_id_seq'::regclass)");

                entity.Property(e => e.Ip)
                    .IsRequired()
                    .HasColumnName("ip");

                entity.Property(e => e.OccurredAt).HasColumnName("occurred_at");

                entity.Property(e => e.Uid).HasColumnName("uid");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Transaction)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Uid);

                entity.ToTable("user", "security");

                entity.Property(e => e.Uid)
                    .HasColumnName("uid")
                    .HasDefaultValueSql("nextval('tw.users_uid_seq'::regclass)");

                entity.Property(e => e.AdminAuthToken).HasColumnName("admin_auth_token");

                entity.Property(e => e.AdminPlayerId).HasColumnName("admin_player_id");

                entity.Property(e => e.AuthToken).HasColumnName("auth_token");

                entity.Property(e => e.Enabled).HasColumnName("enabled");

                entity.Property(e => e.KeySource).HasColumnName("key_source");

                entity.Property(e => e.Label).HasColumnName("label");

                entity.Property(e => e.PermissionsLevel).HasColumnName("permissions_level");

                entity.Property(e => e.PlayerId).HasColumnName("player_id");

                entity.Property(e => e.TransactionTime).HasColumnName("transaction_time");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.User)
                    .HasForeignKey(d => d.WorldId)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<UserLog>(entity =>
            {
                entity.ToTable("user_log", "security");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('security.user_log_id_seq'::regclass)");

                entity.Property(e => e.AdminAuthToken).HasColumnName("admin_auth_token");

                entity.Property(e => e.AdminPlayerId).HasColumnName("admin_player_id");

                entity.Property(e => e.AuthToken).HasColumnName("auth_token");

                entity.Property(e => e.Enabled).HasColumnName("enabled");

                entity.Property(e => e.KeySource).HasColumnName("key_source");

                entity.Property(e => e.Label).HasColumnName("label");

                entity.Property(e => e.OperationType)
                    .IsRequired()
                    .HasColumnName("operation_type")
                    .HasColumnType("character varying");

                entity.Property(e => e.PermissionsLevel).HasColumnName("permissions_level");

                entity.Property(e => e.PlayerId).HasColumnName("player_id");

                entity.Property(e => e.TransactionTime).HasColumnName("transaction_time");

                entity.Property(e => e.Uid).HasColumnName("uid");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.UserLog)
                    .HasForeignKey(d => d.WorldId)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<UserUploadHistory>(entity =>
            {
                entity.ToTable("user_upload_history", "security");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('security.user_upload_history_id_seq'::regclass)");

                entity.Property(e => e.LastUploadedCommandsAt).HasColumnName("last_uploaded_commands_at");

                entity.Property(e => e.LastUploadedIncomingsAt).HasColumnName("last_uploaded_incomings_at");

                entity.Property(e => e.LastUploadedReportsAt).HasColumnName("last_uploaded_reports_at");

                entity.Property(e => e.LastUploadedTroopsAt).HasColumnName("last_uploaded_troops_at");

                entity.Property(e => e.Uid).HasColumnName("uid");

                entity.HasOne(d => d.U)
                    .WithMany(p => p.UserUploadHistory)
                    .HasForeignKey(d => d.Uid)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_uid");
            });

            modelBuilder.Entity<Village>(entity =>
            {
                entity.ToTable("village", "tw_provided");

                entity.HasIndex(e => e.WorldId)
                    .HasName("idx_village_world_id")
                    .ForNpgsqlHasMethod("hash");

                entity.Property(e => e.VillageId)
                    .HasColumnName("village_id")
                    .ValueGeneratedNever();

                entity.Property(e => e.PlayerId).HasColumnName("player_id");

                entity.Property(e => e.Points).HasColumnName("points");

                entity.Property(e => e.VillageName)
                    .HasColumnName("village_name")
                    .HasColumnType("character varying");

                entity.Property(e => e.VillageRank).HasColumnName("village_rank");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.Property(e => e.X).HasColumnName("x");

                entity.Property(e => e.Y).HasColumnName("y");

                entity.HasOne(d => d.Player)
                    .WithMany(p => p.Village)
                    .HasForeignKey(d => d.PlayerId)
                    .HasConstraintName("fk_player_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.Village)
                    .HasForeignKey(d => d.WorldId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.Entity<World>(entity =>
            {
                entity.ToTable("world", "tw_provided");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasDefaultValueSql("nextval('tw_provided.world_id_seq'::regclass)");

                entity.Property(e => e.Hostname)
                    .IsRequired()
                    .HasColumnName("hostname")
                    .HasMaxLength(32);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name")
                    .HasMaxLength(6);
            });

            modelBuilder.Entity<WorldSettings>(entity =>
            {
                entity.HasKey(e => e.Setting);

                entity.ToTable("world_settings", "tw_provided");

                entity.Property(e => e.Setting)
                    .HasColumnName("setting")
                    .HasColumnType("character varying")
                    .ValueGeneratedNever();

                entity.Property(e => e.Value)
                    .HasColumnName("value")
                    .HasColumnType("character varying");

                entity.Property(e => e.WorldId).HasColumnName("world_id");

                entity.HasOne(d => d.World)
                    .WithMany(p => p.WorldSettings)
                    .HasForeignKey(d => d.WorldId)
                    .HasConstraintName("fk_world_id");
            });

            modelBuilder.HasSequence("conflicting_data_record_id_seq");

            modelBuilder.HasSequence("invalid_data_record_id_seq");

            modelBuilder.HasSequence("user_log_id_seq");

            modelBuilder.HasSequence("user_upload_history_id_seq");

            modelBuilder.HasSequence("command_army_id_seq");

            modelBuilder.HasSequence("failed_auth_id_seq");

            modelBuilder.HasSequence("performance_record_id_seq");

            modelBuilder.HasSequence("report_armies_army_id_seq");

            modelBuilder.HasSequence("report_building_report_building_id_seq");

            modelBuilder.HasSequence("tx_id_seq");

            modelBuilder.HasSequence("users_uid_seq");

            modelBuilder.HasSequence<int>("conquers_vault_id_seq");

            modelBuilder.HasSequence<short>("world_id_seq");
        }
    }
}