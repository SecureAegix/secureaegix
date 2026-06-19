const User = require("../models/user");
const Servise = require("../models/services");
const Course = require("../models/cources");
const Blog = require("../models/blog");
const { all } = require("axios");

module.exports.penetrationTesting = async (req, res) => {
	res.render("services/penetrationTesting");
}
module.exports.vulnerabilityAssessment = async (req, res) => {
	res.render("services/vulnerabilityAssessment");
}
module.exports.incidentResponse = async (req, res) => {
	res.render("services/incidentResponse");
}
module.exports.redTeamOperations = async (req, res) => {
	res.render("services/redTeamOperations");
}	

module.exports.socService = async (req, res) => {
	res.render("services/soc.ejs");
}
module.exports.grcService = async (req, res) => {
	res.render("services/grc.ejs");
}