﻿using System;
using System.Collections.Generic;

namespace TW.Vault.Scaffold
{
    public partial class CurrentVillage
    {
        public long VillageId { get; set; }
        public long? ArmyStationedId { get; set; }
        public long? ArmyTravelingId { get; set; }
        public long? ArmyOwnedId { get; set; }
        public short WorldId { get; set; }
        public long? ArmyRecentLossesId { get; set; }
        public short? Loyalty { get; set; }
        public DateTime? LoyaltyLastUpdated { get; set; }

        public CurrentArmy ArmyOwned { get; set; }
        public CurrentArmy ArmyRecentLosses { get; set; }
        public CurrentArmy ArmyStationed { get; set; }
        public CurrentArmy ArmyTraveling { get; set; }
        public Village Village { get; set; }
        public World World { get; set; }
        public CurrentBuilding CurrentBuilding { get; set; }
    }
}