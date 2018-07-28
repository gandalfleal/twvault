﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TW.Vault.Scaffold_Model;

namespace TW.Vault.Controllers
{
    [Produces("application/json")]
    [Route("api/Ally")]
    public class AllyController : ControllerBase
    {
        public AllyController(VaultContext context) : base(context)
        {
        }

        // GET: api/Ally
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(await Paginated(context.Ally).ToListAsync());
        }

        // GET: api/Ally/5
        [HttpGet("{id}", Name = "GetAlly")]
        public Task<IActionResult> Get(int id)
        {
            return FindOr404<Ally>(id);
        }

        [HttpGet("{id}/members", Name = "GetTribeMembers")]
        public async Task<IActionResult> GetMembers(int id)
        {
            var players = await (
                from player in context.Player
                where player.TribeId.Value == id
                select player
            ).ToListAsync();

            if (players.Any())
                return Ok(players);
            else
                return NotFound();
        }

        [HttpGet("{id}/villages", Name = "GetTribeVillages")]
        public async Task<IActionResult> GetVillages(int id)
        {
            var villages = await Paginated (
                from player in context.Player
                where player.TribeId.HasValue && player.TribeId.Value == id
                join village in context.Village on player.PlayerId equals village.PlayerId.Value
                select village
            ).ToListAsync();

            if (villages.Any())
                return Ok(villages);
            else
                return NotFound();
        }
    }
}
