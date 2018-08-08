﻿using System;
using System.Collections.Generic;

namespace TW.Vault.Scaffold_Model
{
    public partial class Command
    {
        public long CommandId { get; set; }
        public long SourceVillageId { get; set; }
        public long SourcePlayerId { get; set; }
        public long TargetVillageId { get; set; }
        public long TargetPlayerId { get; set; }
        public DateTime LandsAt { get; set; }
        public DateTime FirstSeenAt { get; set; }
        public string TroopType { get; set; }
        public bool IsAttack { get; set; }
        public long? ArmyId { get; set; }
        public bool IsReturning { get; set; }
        public long? TxId { get; set; }

        public CommandArmy Army { get; set; }
        public Player SourcePlayer { get; set; }
        public Village SourceVillage { get; set; }
        public Player TargetPlayer { get; set; }
        public Village TargetVillage { get; set; }
        public Transaction Tx { get; set; }
    }
}