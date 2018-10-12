﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TW.Vault.Model.JSON
{
    public class VillageTags
    {
        public bool IsStacked { get; set; }
        public DateTime? StackSeenAt { get; set; }

        public bool HasNuke { get; set; }
        public DateTime? NukeSeenAt { get; set; }

        public bool HasNobles { get; set; }
        public DateTime? NoblesSeenAt { get; set; }

        public bool HasDefense { get; set; }
        public DateTime? DefenseSeenAt { get; set; }
    }
}
