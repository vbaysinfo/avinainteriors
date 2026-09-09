import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { ProjectInfo, Room, CuttingItem, FurnitureItem } from '../types/cad';
import { generateCuttingList, calculateQuotation, calculateMaterialUsage } from './parametricEngine';

/**
 * Generates an AutoCAD compatible 2D DXF file with layered entities.
 */
export function exportToDXF(project: ProjectInfo, room: Room): string {
  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n`;

  // TABLES / LAYERS
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n6\n`;
  const layers = [
    { name: 'WALLS', color: 7 },
    { name: 'DOORS', color: 1 },
    { name: 'WINDOWS', color: 4 },
    { name: 'FURNITURE_BASE', color: 3 },
    { name: 'FURNITURE_WALL', color: 2 },
    { name: 'DIMENSIONS', color: 6 },
    { name: 'ANNOTATIONS', color: 5 },
  ];
  layers.forEach((l) => {
    dxf += `0\nLAYER\n2\n${l.name}\n70\n0\n62\n${l.color}\n6\nCONTINUOUS\n`;
  });
  dxf += `0\nENDTAB\n0\nENDSEC\n`;

  // ENTITIES
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  // Walls
  room.walls.forEach((w) => {
    dxf += `0\nLINE\n8\nWALLS\n10\n${w.x1}\n20\n${-w.y1}\n30\n0.0\n11\n${w.x2}\n21\n${-w.y2}\n31\n0.0\n`;
  });

  // Doors
  room.doors.forEach((d) => {
    dxf += `0\nLINE\n8\nDOORS\n10\n${d.x}\n20\n${-d.y}\n30\n0.0\n11\n${d.x + d.width}\n21\n${-d.y}\n31\n0.0\n`;
    dxf += `0\nARC\n8\nDOORS\n10\n${d.x}\n20\n${-d.y}\n30\n0.0\n40\n${d.width}\n50\n0\n51\n90\n`;
  });

  // Windows
  room.windows.forEach((win) => {
    dxf += `0\nLINE\n8\nWINDOWS\n10\n${win.x}\n20\n${-win.y}\n30\n0.0\n11\n${win.x + win.width}\n21\n${-win.y}\n31\n0.0\n`;
  });

  // Furniture Blocks
  room.furniture.forEach((f) => {
    const layer = f.z > 1000 ? 'FURNITURE_WALL' : 'FURNITURE_BASE';
    const x1 = f.x;
    const y1 = -f.y;
    const x2 = f.x + f.width;
    const y2 = -(f.y + f.depth);

    // Box perimeter
    dxf += `0\nPOLYLINE\n8\n${layer}\n66\n1\n70\n1\n`;
    dxf += `0\nVERTEX\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0.0\n`;
    dxf += `0\nVERTEX\n8\n${layer}\n10\n${x2}\n20\n${y1}\n30\n0.0\n`;
    dxf += `0\nVERTEX\n8\n${layer}\n10\n${x2}\n20\n${y2}\n30\n0.0\n`;
    dxf += `0\nVERTEX\n8\n${layer}\n10\n${x1}\n20\n${y2}\n30\n0.0\n`;
    dxf += `0\nSEQEND\n`;

    // Text label
    dxf += `0\nTEXT\n8\nANNOTATIONS\n10\n${x1 + 50}\n20\n${y1 - f.depth / 2}\n30\n0.0\n40\n120.0\n1\n${f.name} [${f.width}x${f.height}x${f.depth}]\n`;
  });

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

/**
 * Generates an OBJ 3D model preserving nested components hierarchy for SketchUp & CAD.
 */
export function exportToOBJ(project: ProjectInfo, room: Room): string {
  let obj = `# SketchUp & AutoCAD 3D Wavefront Model\n# Project: ${project.name} - Customer: ${project.customerName}\n# Room: ${room.name} (${room.widthMm} x ${room.depthMm} x ${room.heightMm} mm)\n# Exported by Modular Interior CAD & 3D Studio\n\n`;
  obj += `mtllib ${room.name.replace(/\s+/g, '_')}_Materials.mtl\n\n`;

  let vertexOffset = 1;

  function addBox(groupName: string, materialName: string, x: number, y: number, z: number, w: number, d: number, h: number) {
    obj += `g ${groupName.replace(/\s+/g, '_')}\n`;
    obj += `usemtl ${materialName}\n`;

    // 8 vertices in SketchUp coordinate space (X=width, Y=depth, Z=elevation)
    const p1 = [x, y, z];
    const p2 = [x + w, y, z];
    const p3 = [x + w, y + d, z];
    const p4 = [x, y + d, z];
    const p5 = [x, y, z + h];
    const p6 = [x + w, y, z + h];
    const p7 = [x + w, y + d, z + h];
    const p8 = [x, y + d, z + h];

    [p1, p2, p3, p4, p5, p6, p7, p8].forEach(([vx, vy, vz]) => {
      obj += `v ${vx.toFixed(2)} ${vy.toFixed(2)} ${vz.toFixed(2)}\n`;
    });

    const v = vertexOffset;
    // 6 faces (quads)
    obj += `f ${v} ${v + 1} ${v + 5} ${v + 4}\n`; // front (facing -Y)
    obj += `f ${v + 2} ${v + 3} ${v + 7} ${v + 6}\n`; // back (facing +Y)
    obj += `f ${v + 3} ${v} ${v + 4} ${v + 7}\n`; // left (facing -X)
    obj += `f ${v + 1} ${v + 2} ${v + 6} ${v + 5}\n`; // right (facing +X)
    obj += `f ${v + 4} ${v + 5} ${v + 6} ${v + 7}\n`; // top (facing +Z)
    obj += `f ${v + 3} ${v + 2} ${v + 1} ${v}\n`; // bottom (facing -Z)

    vertexOffset += 8;
  }

  // Room Floor Slab
  addBox('Room_Floor_Slab', 'Mat_Floor_Slab', 0, 0, -50, room.widthMm, room.depthMm, 50);

  // Room Walls
  room.walls.forEach((w, idx) => {
    addBox(`Wall_${idx + 1}`, 'Mat_Wall', Math.min(w.x1, w.x2), Math.min(w.y1, w.y2), 0, Math.max(w.thickness, Math.abs(w.x2 - w.x1)), Math.max(w.thickness, Math.abs(w.y2 - w.y1)), w.height);
  });

  // Furniture Components (Preserving Component Structure)
  room.furniture.forEach((f) => {
    const baseGroupName = `${f.category.toUpperCase()}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 1. Carcass Box
    addBox(`${baseGroupName}_Carcass`, 'Mat_Carcass', f.x, f.y, f.z, f.width, f.depth, f.height);

    // 2. Shutters / Front
    if ((f.parametric.shutterCount || 0) > 0 && f.parametric.shutterType !== 'open') {
      const shutterThick = 18;
      const count = f.parametric.shutterCount;
      const shutterW = (f.width - (count - 1) * 3) / count;
      for (let i = 0; i < count; i++) {
        addBox(`${baseGroupName}_Shutter_${i + 1}`, 'Mat_Shutter', f.x + i * (shutterW + 3), f.y + f.depth, f.z + (f.parametric.skirtingHeight || 0), shutterW, shutterThick, f.height - (f.parametric.skirtingHeight || 0));
        // Handle
        addBox(`${baseGroupName}_Handle_${i + 1}`, 'Mat_Handle', f.x + i * (shutterW + 3) + shutterW - 20, f.y + f.depth + shutterThick, f.z + f.height / 2, 10, 10, 80);
      }
    }

    // 3. Countertop
    if (f.parametric.hasCountertop) {
      const ov = f.parametric.countertopOverhang || 25;
      const ct = f.parametric.countertopThickness || 20;
      addBox(`${baseGroupName}_Countertop`, 'Mat_Countertop', f.x - ov, f.y - ov, f.z + f.height, f.width + ov * 2, f.depth + ov * 2, ct);
    }
  });

  return obj;
}

/**
 * Generates an MTL material definition library for SketchUp / Wavefront OBJ.
 */
export function exportToMTL(project: ProjectInfo, room: Room): string {
  return `# SketchUp Material Library for ${project.name} - ${room.name}
newmtl Mat_Floor_Slab
Ka 0.8 0.8 0.8
Kd 0.75 0.78 0.82
Ks 0.1 0.1 0.1
d 1.0
illum 2

newmtl Mat_Wall
Ka 0.85 0.85 0.85
Kd 0.88 0.90 0.92
Ks 0.05 0.05 0.05
d 1.0
illum 2

newmtl Mat_Carcass
Ka 0.8 0.8 0.8
Kd 0.85 0.87 0.90
Ks 0.1 0.1 0.1
d 1.0
illum 2

newmtl Mat_Shutter
Ka 0.9 0.9 0.9
Kd 0.95 0.95 0.96
Ks 0.3 0.3 0.3
Ns 40
d 1.0
illum 2

newmtl Mat_Countertop
Ka 0.9 0.9 0.9
Kd 0.92 0.90 0.88
Ks 0.4 0.4 0.4
Ns 60
d 1.0
illum 2

newmtl Mat_Handle
Ka 0.7 0.5 0.2
Kd 0.85 0.65 0.25
Ks 0.8 0.7 0.4
Ns 100
d 1.0
illum 2
`;
}

/**
 * Generates a full native SketchUp Ruby Script (.rb) that builds genuine SketchUp Dynamic Components
 * with embedded parametric attributes, dimensions, nested sub-components, materials, and layers.
 */
export function exportToSketchUpRuby(project: ProjectInfo, room: Room): string {
  const cuttingList = generateCuttingList(room.furniture);
  const quotation = calculateQuotation(room.furniture);

  let script = `# ==============================================================================
# SKETCHUP DYNAMIC COMPONENT & PARAMETRIC MODEL GENERATOR
# Project: ${project.name}
# Customer: ${project.customerName}
# Room: ${room.name} (${room.widthMm} x ${room.depthMm} x ${room.heightMm} mm)
# Generated by: Modular CAD & 3D Interior Studio
# ==============================================================================
# HOW TO RUN IN SKETCHUP:
# 1. Open SketchUp (Make / Pro / Studio / Free).
# 2. Go to: Window -> Ruby Console.
# 3. Paste this entire code into the console, OR type: load 'this_file.rb'
# 4. Press Enter. All modular components will be created with parametric metadata!
# ==============================================================================

require 'sketchup.rb'

module ModularInteriorCAD
  def self.build_project
    model = Sketchup.active_model
    model.start_operation("Generate Modular Interior - ${room.name.replace(/"/g, '\\"')}", true)

    entities = model.active_entities
    defs = model.definitions
    layers = model.layers
    materials = model.materials

    # Set Model Units to Millimeters if possible
    begin
      model.options['UnitsOptions']['LengthUnit'] = 2 # mm
    rescue
      # Fallback
    end

    # 1. Create Layers / Tags
    layer_base = layers.add("Modular_Base_Units")
    layer_wall = layers.add("Modular_Wall_Units")
    layer_tall = layers.add("Modular_Tall_Wardrobes")
    layer_counter = layers.add("Modular_Countertops")
    layer_walls = layers.add("Architectural_Walls")
    layer_hardware = layers.add("Modular_Hardware")

    # Helper: Create or retrieve a material with RGB
    get_mat = lambda do |name, r, g, b|
      mat = materials[name]
      unless mat
        mat = materials.add(name)
        mat.color = Sketchup::Color.new(r, g, b)
      end
      mat
    end

    mat_carcass = get_mat.call("Modular_Carcass_White", 230, 235, 240)
    mat_shutter = get_mat.call("Modular_Shutter_Finish", 245, 245, 248)
    mat_counter = get_mat.call("Modular_Countertop_Quartz", 225, 222, 215)
    mat_handle = get_mat.call("Modular_Handle_Gold", 218, 165, 32)
    mat_wall = get_mat.call("Wall_RCC", 210, 215, 220)
    mat_floor = get_mat.call("Floor_Tile", 195, 200, 208)

    # Helper: Create 3D Solid Box in entities
    create_box = lambda do |target_ents, x, y, z, w, d, h, mat, lay|
      return if w <= 0 || d <= 0 || h <= 0
      # Convert mm to SketchUp internal inch units (.mm method)
      pt1 = [x.mm, y.mm, z.mm]
      pt2 = [(x + w).mm, y.mm, z.mm]
      pt3 = [(x + w).mm, (y + d).mm, z.mm]
      pt4 = [x.mm, (y + d).mm, z.mm]

      face = target_ents.add_face(pt1, pt2, pt3, pt4)
      if face
        face.pushpull(h.mm)
        target_ents.grep(Sketchup::Face).each do |f|
          f.material = mat if mat
          f.back_material = mat if mat
          f.layer = lay if lay
        end
      end
    end

    # Helper: Attach SketchUp Dynamic Component Attributes
    attach_dc_attributes = lambda do |comp_def, comp_inst, attr_hash|
      dict = comp_def.attribute_dictionary('dynamic_attributes', true)
      attr_hash.each do |k, v|
        dict[k.to_s] = v.to_s
        dict["_#{k}_label"] = k.to_s.gsub('_', ' ').capitalize
        dict["_#{k}_access"] = "VIEW"
        dict["_#{k}_formlabel"] = k.to_s.gsub('_', ' ').capitalize
      end

      inst_dict = comp_inst.attribute_dictionary('dynamic_attributes', true)
      inst_dict['_name'] = comp_def.name
      inst_dict['description'] = attr_hash[:description] || comp_def.name
    end

    # 2. Build Room Architectural Walls and Floor Slab
    room_group = entities.add_group
    room_group.name = "Room_Structure_${room.name.replace(/[^a-zA-Z0-9]/g, '_')}"
    create_box.call(room_group.entities, 0, 0, -50, ${room.widthMm}, ${room.depthMm}, 50, mat_floor, layer_walls)

    # Walls
`;

  room.walls.forEach((w, idx) => {
    const wx = Math.min(w.x1, w.x2);
    const wy = Math.min(w.y1, w.y2);
    const ww = Math.max(w.thickness, Math.abs(w.x2 - w.x1));
    const wd = Math.max(w.thickness, Math.abs(w.y2 - w.y1));
    script += `    create_box.call(room_group.entities, ${wx}, ${wy}, 0, ${ww}, ${wd}, ${w.height}, mat_wall, layer_walls)\n`;
  });

  script += `\n    # 3. Build Parametric Modular Furniture Units\n`;

  room.furniture.forEach((f, fIdx) => {
    const cleanDefName = `${f.category.toUpperCase()}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}_${fIdx + 1}`;
    const unitCuttingItems = cuttingList.filter((c) => c.parentFurnitureId === f.id);
    const itemQuote = quotation.itemizedFurniture.find((q) => q.id === f.id);

    const layerRef = f.z > 1000 ? 'layer_wall' : f.height > 1800 ? 'layer_tall' : 'layer_base';

    script += `
    # Unit: ${f.name}
    def_${fIdx} = defs.add("${cleanDefName}")
    def_${fIdx}.description = "Parametric Modular ${f.category}: ${f.name} [${f.width}x${f.depth}x${f.height}mm]"

    # Sub-component 1: Carcass
    create_box.call(def_${fIdx}.entities, 0, 0, 0, ${f.width}, ${f.depth}, ${f.height}, mat_carcass, ${layerRef})
`;

    // Shutters
    if ((f.parametric.shutterCount || 0) > 0 && f.parametric.shutterType !== 'open') {
      const sCount = f.parametric.shutterCount;
      const sThick = 18;
      const sWidth = (f.width - (sCount - 1) * 4) / sCount;
      const skirting = f.parametric.skirtingHeight || 0;
      const sHeight = f.height - skirting - 6;

      script += `    # Sub-component 2: Shutters & Handles (${sCount} shutters)\n`;
      for (let s = 0; s < sCount; s++) {
        const sx = s * (sWidth + 4);
        script += `    create_box.call(def_${fIdx}.entities, ${sx}, ${f.depth}, ${skirting}, ${sWidth.toFixed(1)}, ${sThick}, ${sHeight.toFixed(1)}, mat_shutter, ${layerRef})\n`;
        // Handle
        script += `    create_box.call(def_${fIdx}.entities, ${(sx + sWidth - 25).toFixed(1)}, ${f.depth + sThick}, ${(skirting + sHeight / 2 - 40).toFixed(1)}, 12, 10, 80, mat_handle, layer_hardware)\n`;
      }
    }

    // Countertop
    if (f.parametric.hasCountertop) {
      const ov = f.parametric.countertopOverhang || 25;
      const ct = f.parametric.countertopThickness || 20;
      script += `    # Sub-component 3: Countertop Slab\n`;
      script += `    create_box.call(def_${fIdx}.entities, ${-ov}, ${-ov}, ${f.height}, ${f.width + ov * 2}, ${f.depth + ov * 2}, ${ct}, mat_counter, layer_counter)\n`;
    }

    // Instantiation at coordinates
    script += `
    # Place Instance in Model Entities
    t_${fIdx} = Geom::Transformation.translation([${f.x}.mm, ${f.y}.mm, ${f.z}.mm])
    inst_${fIdx} = entities.add_instance(def_${fIdx}, t_${fIdx})
    inst_${fIdx}.layer = ${layerRef}

    # Attach Parametric Dynamic Component Attributes
    attach_dc_attributes.call(def_${fIdx}, inst_${fIdx}, {
      :item_id => "${f.id}",
      :item_name => "${f.name.replace(/"/g, '\\"')}",
      :category => "${f.category}",
      :width_mm => ${f.width},
      :depth_mm => ${f.depth},
      :height_mm => ${f.height},
      :elevation_z_mm => ${f.z},
      :carcass_material => "${f.materials.carcassMaterial || '18mm BWP Plywood'}",
      :carcass_thickness_mm => ${f.parametric.carcassThickness || 18},
      :shutter_type => "${f.parametric.shutterType || 'hinged'}",
      :shutter_finish => "${f.materials.shutterFinish || 'High Gloss Acrylic'}",
      :shutter_color => "${f.materials.shutterColor || '#FFFFFF'}",
      :handle_type => "${f.parametric.handleType || 'g_profile'}",
      :hardware_hinges_pairs => ${f.parametric.hingesCount || 0},
      :hardware_slide_pairs => ${f.parametric.slidePairs || 0},
      :hardware_handles_count => ${f.parametric.handlesCount || 0},
      :skirting_legs_count => ${f.parametric.legsCount || 0},
      :cutting_list_panels_count => ${unitCuttingItems.length},
      :estimated_cost_inr => ${itemQuote ? itemQuote.estimatedCost : 0},
      :LenX => "${f.width}.mm",
      :LenY => "${f.depth}.mm",
      :LenZ => "${f.height}.mm"
    })
`;
  });

  script += `
    model.commit_operation
    puts "✅ Successfully imported ${room.furniture.length} Parametric Modular Components into SketchUp!"
    UI.messagebox("✅ Successfully generated ${room.furniture.length} Parametric 3D Modular Furniture Units for '${room.name}' with Dynamic Component Attributes!")
  end
end

ModularInteriorCAD.build_project
`;

  return script;
}

/**
 * Generates an industry standard Collada 1.4/1.5 (.dae) 3D model natively supported by SketchUp,
 * including structured component hierarchies, materials, and embedded parametric XML metadata.
 */
export function exportToSketchUpCollada(project: ProjectInfo, room: Room): string {
  const now = new Date().toISOString();
  const cuttingList = generateCuttingList(room.furniture);
  const quotation = calculateQuotation(room.furniture);

  let dae = `<?xml version="1.0" encoding="utf-8"?>
<COLLADA xmlns="http://www.collada.org/2005/11/COLLADASchema" version="1.4.1">
  <asset>
    <contributor>
      <author>${project.customerName || 'Modular CAD Designer'}</author>
      <authoring_tool>Modular Interior CAD &amp; 3D Studio SketchUp Exporter</authoring_tool>
      <comments>Parametric 3D Model with Dynamic BIM Metadata</comments>
    </contributor>
    <created>${now}</created>
    <modified>${now}</modified>
    <unit meter="0.001" name="millimeter"/>
    <up_axis>Z_UP</up_axis>
  </asset>

  <library_materials>
    <material id="mat_carcass" name="Modular_Carcass">
      <instance_effect url="#eff_carcass"/>
    </material>
    <material id="mat_shutter" name="Modular_Shutter">
      <instance_effect url="#eff_shutter"/>
    </material>
    <material id="mat_counter" name="Modular_Countertop">
      <instance_effect url="#eff_counter"/>
    </material>
    <material id="mat_handle" name="Modular_Handle">
      <instance_effect url="#eff_handle"/>
    </material>
    <material id="mat_wall" name="Modular_Wall">
      <instance_effect url="#eff_wall"/>
    </material>
    <material id="mat_floor" name="Modular_Floor">
      <instance_effect url="#eff_floor"/>
    </material>
  </library_materials>

  <library_effects>
    <effect id="eff_carcass">
      <profile_COMMON>
        <technique sid="common">
          <phong>
            <diffuse><color>0.90 0.92 0.94 1.0</color></diffuse>
            <specular><color>0.1 0.1 0.1 1.0</color></specular>
            <shininess><float>20</float></shininess>
          </phong>
        </technique>
      </profile_COMMON>
    </effect>
    <effect id="eff_shutter">
      <profile_COMMON>
        <technique sid="common">
          <phong>
            <diffuse><color>0.96 0.96 0.98 1.0</color></diffuse>
            <specular><color>0.3 0.3 0.3 1.0</color></specular>
            <shininess><float>60</float></shininess>
          </phong>
        </technique>
      </profile_COMMON>
    </effect>
    <effect id="eff_counter">
      <profile_COMMON>
        <technique sid="common">
          <phong>
            <diffuse><color>0.88 0.87 0.85 1.0</color></diffuse>
            <specular><color>0.4 0.4 0.4 1.0</color></specular>
            <shininess><float>80</float></shininess>
          </phong>
        </technique>
      </profile_COMMON>
    </effect>
    <effect id="eff_handle">
      <profile_COMMON>
        <technique sid="common">
          <phong>
            <diffuse><color>0.85 0.65 0.20 1.0</color></diffuse>
            <specular><color>0.8 0.7 0.4 1.0</color></specular>
            <shininess><float>120</float></shininess>
          </phong>
        </technique>
      </profile_COMMON>
    </effect>
    <effect id="eff_wall">
      <profile_COMMON>
        <technique sid="common">
          <lambert>
            <diffuse><color>0.85 0.87 0.90 1.0</color></diffuse>
          </lambert>
        </technique>
      </profile_COMMON>
    </effect>
    <effect id="eff_floor">
      <profile_COMMON>
        <technique sid="common">
          <lambert>
            <diffuse><color>0.75 0.78 0.82 1.0</color></diffuse>
          </lambert>
        </technique>
      </profile_COMMON>
    </effect>
  </library_effects>

  <library_geometries>
`;

  // Standard Box Geometry Generator helper in Collada
  function generateBoxGeometry(geomId: string, w: number, d: number, h: number) {
    const x0 = 0, y0 = 0, z0 = 0;
    const x1 = w, y1 = d, z1 = h;
    const positions = [
      x0, y0, z0,  x1, y0, z0,  x1, y1, z0,  x0, y1, z0, // Bottom 0,1,2,3
      x0, y0, z1,  x1, y0, z1,  x1, y1, z1,  x0, y1, z1  // Top 4,5,6,7
    ].join(' ');

    const normals = [
      "0 0 -1", "0 0 1", "0 -1 0", "1 0 0", "0 1 0", "-1 0 0"
    ].join(' ');

    // 12 triangles (2 per cube face)
    const indices = [
      0,0, 2,0, 1,0,   0,0, 3,0, 2,0, // Bottom
      4,1, 5,1, 6,1,   4,1, 6,1, 7,1, // Top
      0,2, 1,2, 5,2,   0,2, 5,2, 4,2, // Front
      1,3, 2,3, 6,3,   1,3, 6,3, 5,3, // Right
      2,4, 3,4, 7,4,   2,4, 7,4, 6,4, // Back
      3,5, 0,5, 4,5,   3,5, 4,5, 7,5  // Left
    ].join(' ');

    return `
    <geometry id="${geomId}" name="${geomId}">
      <mesh>
        <source id="${geomId}-positions">
          <float_array id="${geomId}-positions-array" count="24">${positions}</float_array>
          <technique_common>
            <accessor source="#${geomId}-positions-array" count="8" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <source id="${geomId}-normals">
          <float_array id="${geomId}-normals-array" count="18">${normals}</float_array>
          <technique_common>
            <accessor source="#${geomId}-normals-array" count="6" stride="3">
              <param name="X" type="float"/>
              <param name="Y" type="float"/>
              <param name="Z" type="float"/>
            </accessor>
          </technique_common>
        </source>
        <vertices id="${geomId}-vertices">
          <input semantic="POSITION" source="#${geomId}-positions"/>
        </vertices>
        <triangles material="MatSymbol" count="12">
          <input semantic="VERTEX" source="#${geomId}-vertices" offset="0"/>
          <input semantic="NORMAL" source="#${geomId}-normals" offset="1"/>
          <p>${indices}</p>
        </triangles>
      </mesh>
    </geometry>`;
  }

  // Room Floor Slab Geometry
  dae += generateBoxGeometry('geom_floor', room.widthMm, room.depthMm, 50);

  // Furniture Geometries
  room.furniture.forEach((f, idx) => {
    dae += generateBoxGeometry(`geom_carcass_${idx}`, f.width, f.depth, f.height);
    if ((f.parametric.shutterCount || 0) > 0 && f.parametric.shutterType !== 'open') {
      const sCount = f.parametric.shutterCount;
      const sW = (f.width - (sCount - 1) * 4) / sCount;
      const skirting = f.parametric.skirtingHeight || 0;
      const sH = f.height - skirting - 6;
      dae += generateBoxGeometry(`geom_shutter_${idx}`, sW, 18, sH);
    }
    if (f.parametric.hasCountertop) {
      const ov = f.parametric.countertopOverhang || 25;
      const ct = f.parametric.countertopThickness || 20;
      dae += generateBoxGeometry(`geom_counter_${idx}`, f.width + ov * 2, f.depth + ov * 2, ct);
    }
  });

  dae += `
  </library_geometries>

  <library_visual_scenes>
    <visual_scene id="Scene" name="SketchUp_Modular_Scene">
      <!-- Floor Slab -->
      <node id="Floor_Slab" name="Floor_Slab">
        <translate>0 0 -50</translate>
        <instance_geometry url="#geom_floor">
          <bind_material><technique_common><instance_material symbol="MatSymbol" target="#mat_floor"/></technique_common></bind_material>
        </instance_geometry>
      </node>
`;

  // Furniture Nodes with SketchUp Parametric Metadata
  room.furniture.forEach((f, idx) => {
    const unitCuttingItems = cuttingList.filter((c) => c.parentFurnitureId === f.id);
    const itemQuote = quotation.itemizedFurniture.find((q) => q.id === f.id);

    dae += `
      <!-- Furniture Component: ${f.name} -->
      <node id="node_furniture_${idx}" name="${f.name.replace(/[^a-zA-Z0-9]/g, '_')}">
        <translate>${f.x} ${f.y} ${f.z}</translate>
        
        <!-- Carcass -->
        <node id="node_carcass_${idx}" name="Carcass">
          <instance_geometry url="#geom_carcass_${idx}">
            <bind_material><technique_common><instance_material symbol="MatSymbol" target="#mat_carcass"/></technique_common></bind_material>
          </instance_geometry>
        </node>
`;

    if ((f.parametric.shutterCount || 0) > 0 && f.parametric.shutterType !== 'open') {
      const sCount = f.parametric.shutterCount;
      const sW = (f.width - (sCount - 1) * 4) / sCount;
      const skirting = f.parametric.skirtingHeight || 0;
      for (let s = 0; s < sCount; s++) {
        const sx = s * (sW + 4);
        dae += `
        <!-- Shutter ${s + 1} -->
        <node id="node_shutter_${idx}_${s}" name="Shutter_${s + 1}">
          <translate>${sx.toFixed(1)} ${f.depth} ${skirting}</translate>
          <instance_geometry url="#geom_shutter_${idx}">
            <bind_material><technique_common><instance_material symbol="MatSymbol" target="#mat_shutter"/></technique_common></bind_material>
          </instance_geometry>
        </node>`;
      }
    }

    if (f.parametric.hasCountertop) {
      const ov = f.parametric.countertopOverhang || 25;
      dae += `
        <!-- Countertop -->
        <node id="node_counter_${idx}" name="Countertop">
          <translate>${-ov} ${-ov} ${f.height}</translate>
          <instance_geometry url="#geom_counter_${idx}">
            <bind_material><technique_common><instance_material symbol="MatSymbol" target="#mat_counter"/></technique_common></bind_material>
          </instance_geometry>
        </node>`;
    }

    // Embed SketchUp Dynamic Component Attributes into Collada <extra>
    dae += `
        <extra>
          <technique profile="SketchUp">
            <dynamic_attributes>
              <item_id>${f.id}</item_id>
              <item_name>${f.name}</item_name>
              <category>${f.category}</category>
              <width_mm>${f.width}</width_mm>
              <depth_mm>${f.depth}</depth_mm>
              <height_mm>${f.height}</height_mm>
              <elevation_z_mm>${f.z}</elevation_z_mm>
              <carcass_material>${f.materials.carcassMaterial || '18mm BWP Ply'}</carcass_material>
              <carcass_thickness>${f.parametric.carcassThickness || 18}</carcass_thickness>
              <shutter_type>${f.parametric.shutterType || 'hinged'}</shutter_type>
              <shutter_finish>${f.materials.shutterFinish || 'High Gloss Acrylic'}</shutter_finish>
              <shutter_color>${f.materials.shutterColor || '#FFFFFF'}</shutter_color>
              <handle_type>${f.parametric.handleType || 'g_profile'}</handle_type>
              <hardware_hinges_pairs>${f.parametric.hingesCount || 0}</hardware_hinges_pairs>
              <hardware_slide_pairs>${f.parametric.slidePairs || 0}</hardware_slide_pairs>
              <hardware_handles_count>${f.parametric.handlesCount || 0}</hardware_handles_count>
              <cutting_list_panels_count>${unitCuttingItems.length}</cutting_list_panels_count>
              <estimated_cost_inr>${itemQuote ? itemQuote.estimatedCost : 0}</estimated_cost_inr>
            </dynamic_attributes>
          </technique>
        </extra>
      </node>
`;
  });

  dae += `
    </visual_scene>
  </library_visual_scenes>

  <scene>
    <instance_visual_scene url="#Scene"/>
  </scene>
</COLLADA>`;

  return dae;
}

/**
 * Generates a structured JSON BIM & Parametric Mapping dictionary linking every 3D model GUID to its
 * parametric dimensions, hardware counts, cutting list panels, edge banding details, and quotation.
 */
export function exportToSketchUpParametricMappingJSON(project: ProjectInfo, room: Room): string {
  const cuttingList = generateCuttingList(room.furniture);
  const quotation = calculateQuotation(room.furniture);

  const payload = {
    metadata: {
      exporter: 'Modular CAD Pro - SketchUp (.SKP) Parametric Mapping Bridge',
      version: '2.5',
      exportDate: new Date().toISOString(),
      project: {
        id: project.id,
        name: project.name,
        customerName: project.customerName,
        siteAddress: project.siteAddress,
        projectType: project.projectType,
      },
      room: {
        id: room.id,
        name: room.name,
        type: room.type,
        dimensions: {
          widthMm: room.widthMm,
          depthMm: room.depthMm,
          heightMm: room.heightMm,
        },
      },
    },
    sketchupDynamicComponents: room.furniture.map((f, idx) => {
      const unitCutList = cuttingList.filter((c) => c.parentFurnitureId === f.id);
      const unitQuote = quotation.itemizedFurniture.find((q) => q.id === f.id);

      return {
        guid: f.id,
        sketchupDefName: `${f.category.toUpperCase()}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`,
        name: f.name,
        category: f.category,
        coordinates: {
          xMm: f.x,
          yMm: f.y,
          zElevationMm: f.z,
          rotationDeg: f.rotation || 0,
        },
        dimensions: {
          widthMm: f.width,
          depthMm: f.depth,
          heightMm: f.height,
        },
        parametricAttributes: {
          carcassThicknessMm: f.parametric.carcassThickness || 18,
          backPlyThicknessMm: f.parametric.backPlyThickness || 9,
          shutterCount: f.parametric.shutterCount || 0,
          shutterType: f.parametric.shutterType || 'hinged',
          shutterFinish: f.materials.shutterFinish || 'High Gloss Acrylic',
          shutterColor: f.materials.shutterColor || '#FFFFFF',
          handleType: f.parametric.handleType || 'g_profile',
          drawerCount: f.parametric.drawerCount || 0,
          shelfCount: f.parametric.shelfCount || 0,
          hasCountertop: !!f.parametric.hasCountertop,
          countertopThicknessMm: f.parametric.countertopThickness || 20,
          countertopOverhangMm: f.parametric.countertopOverhang || 25,
          skirtingHeightMm: f.parametric.skirtingHeight || 75,
        },
        materials: f.materials,
        hardwareSchedule: {
          softCloseHingesPairs: f.parametric.hingesCount || 0,
          tandemSlidePairs: f.parametric.slidePairs || 0,
          handlesCount: f.parametric.handlesCount || 0,
          skirtingLevelerLegsCount: f.parametric.legsCount || 0,
        },
        manufacturingCostEstimateINR: unitQuote ? unitQuote.estimatedCost : 0,
        cuttingListParts: unitCutList.map((part) => ({
          partName: part.partName,
          qty: part.qty,
          lengthMm: part.length,
          widthMm: part.width,
          thicknessMm: part.thickness,
          material: part.material,
          finish: part.finish,
          edgeBanding: {
            top: part.edgeBandingSides.top ? `${part.edgeBandingThickness}mm` : 'None',
            bottom: part.edgeBandingSides.bottom ? `${part.edgeBandingThickness}mm` : 'None',
            left: part.edgeBandingSides.left ? `${part.edgeBandingThickness}mm` : 'None',
            right: part.edgeBandingSides.right ? `${part.edgeBandingThickness}mm` : 'None',
          },
          grainDirection: part.grainDirection,
          cncNotes: part.remarks || 'Standard Machining',
        })),
      };
    }),
    summaryQuotation: quotation,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generates a tabular CSV mapping 3D furniture models to all parametric attributes and BOM.
 */
export function exportToSketchUpParametricCSV(project: ProjectInfo, room: Room): string {
  const cuttingList = generateCuttingList(room.furniture);
  const quotation = calculateQuotation(room.furniture);

  let csv = `SKETCHUP_COMPONENT_NAME,GUID,CATEGORY,NAME,WIDTH_MM,DEPTH_MM,HEIGHT_MM,ELEVATION_Z_MM,CARCASS_MAT,CARCASS_THICK_MM,SHUTTER_COUNT,SHUTTER_TYPE,SHUTTER_FINISH,SHUTTER_COLOR,HANDLE_TYPE,HINGES_PAIRS,SLIDE_PAIRS,HANDLES_COUNT,LEGS_COUNT,CUTTING_PARTS_COUNT,ESTIMATED_COST_INR\n`;

  room.furniture.forEach((f, idx) => {
    const defName = `${f.category.toUpperCase()}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`;
    const unitCutList = cuttingList.filter((c) => c.parentFurnitureId === f.id);
    const unitQuote = quotation.itemizedFurniture.find((q) => q.id === f.id);

    csv += `"${defName}","${f.id}","${f.category}","${f.name.replace(/"/g, '""')}",${f.width},${f.depth},${f.height},${f.z},"${f.materials.carcassMaterial || '18mm BWP Ply'}",${f.parametric.carcassThickness || 18},${f.parametric.shutterCount || 0},"${f.parametric.shutterType || 'hinged'}","${f.materials.shutterFinish || 'Acrylic'}","${f.materials.shutterColor || '#FFF'}","${f.parametric.handleType || 'g_profile'}",${f.parametric.hingesCount || 0},${f.parametric.slidePairs || 0},${f.parametric.handlesCount || 0},${f.parametric.legsCount || 0},${unitCutList.length},${unitQuote ? unitQuote.estimatedCost : 0}\n`;
  });

  return csv;
}

/**
 * Bundles all SketchUp formats (.rb Dynamic Component Script, .dae Collada 3D, .obj + .mtl, .json parametric mapping, .csv schedule, and README)
 * into a single unified .ZIP archive for seamless SketchUp workflow.
 */
export async function exportSketchUpPackageZIP(project: ProjectInfo, room: Room): Promise<Blob> {
  const zip = new JSZip();
  const baseName = `${project.name.replace(/\s+/g, '_')}_${room.name.replace(/\s+/g, '_')}`;

  // 1. SketchUp Ruby Dynamic Component Script
  const rubyScript = exportToSketchUpRuby(project, room);
  zip.file(`${baseName}_SketchUp_Dynamic_Components.rb`, rubyScript);

  // 2. SketchUp Collada 3D Model
  const colladaModel = exportToSketchUpCollada(project, room);
  zip.file(`${baseName}_SketchUp_Model.dae`, colladaModel);

  // 3. Wavefront OBJ & MTL
  const objContent = exportToOBJ(project, room);
  const mtlContent = exportToMTL(project, room);
  zip.file(`${baseName}_Model.obj`, objContent);
  zip.file(`${room.name.replace(/\s+/g, '_')}_Materials.mtl`, mtlContent);

  // 4. Parametric BIM Data Mapping JSON
  const jsonMapping = exportToSketchUpParametricMappingJSON(project, room);
  zip.file(`${baseName}_Parametric_Data_Mapping.json`, jsonMapping);

  // 5. Parametric Schedule CSV
  const csvSchedule = exportToSketchUpParametricCSV(project, room);
  zip.file(`${baseName}_Parametric_Schedule.csv`, csvSchedule);

  // 6. Comprehensive SketchUp Import Guide
  const readme = `==============================================================================
SKETCHUP (.SKP) PARAMETRIC MODULAR FURNITURE EXPORT PACKAGE
==============================================================================
Project: ${project.name}
Customer: ${project.customerName}
Room: ${room.name} (${room.widthMm} x ${room.depthMm} x ${room.heightMm} mm)
Total 3D Furniture Units: ${room.furniture.length}
==============================================================================

INCLUDED FILES:
1. ${baseName}_SketchUp_Dynamic_Components.rb
   - Native SketchUp Ruby generator script.
   - Creates full 3D SketchUp Component Definitions with true Dynamic Attributes.
   - Maps Width, Depth, Height, Carcass Grade, Shutter Types, Hardware fittings,
     Cutting List summary, and INR Cost into SketchUp's Dynamic Attributes Inspector!

2. ${baseName}_SketchUp_Model.dae (Collada 3D)
   - Direct Open / Import in Trimble SketchUp (File -> Import -> COLLADA Files).
   - Preserves 3D components, materials, colors, and embedded parametric XML tags.

3. ${baseName}_Model.obj & ${room.name.replace(/\s+/g, '_')}_Materials.mtl
   - Universal Wavefront 3D model with grouped furniture components and materials.

4. ${baseName}_Parametric_Data_Mapping.json
   - Full structured BIM dictionary mapping each 3D Component ID to its parametric
     formulas, panel dimensions, edge banding rules, and hardware schedules.

5. ${baseName}_Parametric_Schedule.csv
   - Tabular parametric schedule compatible with Excel and SketchUp Generate Report.

==============================================================================
HOW TO IMPORT INTO SKETCHUP:
==============================================================================

OPTION A: NATIVE RUBY DYNAMIC GENERATOR (RECOMMENDED FOR FULL PARAMETRIC ATTRIBUTES)
1. Open Trimble SketchUp (Make / Pro / Studio / Free).
2. Go to top menu: Window -> Ruby Console.
3. Open the file "${baseName}_SketchUp_Dynamic_Components.rb" in any text editor,
   copy all text, paste into the Ruby Console and press Enter.
   (Or run: load 'C:/path/to/${baseName}_SketchUp_Dynamic_Components.rb')
4. The 3D room and all modular furniture will be generated instantly!
5. Right click any furniture piece -> Dynamic Components -> Component Options / Attributes
   to inspect all mapped parametric data, carcass specs, hardware, and pricing.

OPTION B: DIRECT 3D COLLADA IMPORT
1. Open SketchUp.
2. Go to File -> Import.
3. Choose "COLLADA Files (*.dae)" in file type dropdown.
4. Select "${baseName}_SketchUp_Model.dae" and click Import.
5. All 3D furniture models, materials, and layers will be placed in your scene!

==============================================================================
Exported with Modular CAD & 3D Interior Studio.
`;
  zip.file('README_SKETCHUP_IMPORT_GUIDE.txt', readme);

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Generates an Excel workbook (.xlsx) containing Cutting List (MaxCut format), Hardware, and Quotation.
 */
export function exportToExcel(project: ProjectInfo, room: Room): void {
  const cuttingList = generateCuttingList(room.furniture);
  const quote = calculateQuotation(room.furniture);
  const materials = calculateMaterialUsage(room.furniture);

  const wb = XLSX.utils.book_new();

  // 1. Material Usage & Sheet Summary
  const materialSummaryData = [
    { 'Category': 'GENERAL ROOM METRICS', 'Parameter': 'Total Furniture Cabinets', 'Quantity': materials.totalFurnitureUnits, 'Unit': 'Units', 'Notes': room.name },
    { 'Category': 'GENERAL ROOM METRICS', 'Parameter': 'Total Cut Pieces / Panels', 'Quantity': materials.totalPieces, 'Unit': 'Pieces', 'Notes': 'All panels across room' },
    { 'Category': '', 'Parameter': '', 'Quantity': '', 'Unit': '', 'Notes': '' },
    { 'Category': 'COMMERCIAL SHEET USAGE (8ft x 4ft)', 'Parameter': '18mm Carcass Plywood', 'Quantity': materials.sheets.carcass18mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.sheets.carcass18mm.netSqFt} Sq.Ft net + 12% wastage (${materials.sheets.carcass18mm.grossSqFt} Sq.Ft gross)` },
    { 'Category': 'COMMERCIAL SHEET USAGE (8ft x 4ft)', 'Parameter': '8mm Backing Ply', 'Quantity': materials.sheets.backPly8mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.sheets.backPly8mm.netSqFt} Sq.Ft net + 10% wastage (${materials.sheets.backPly8mm.grossSqFt} Sq.Ft gross)` },
    { 'Category': 'COMMERCIAL SHEET USAGE (8ft x 4ft)', 'Parameter': '18mm Shutter Boards (HDHMR/MDF)', 'Quantity': materials.sheets.shutterBoard18mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.sheets.shutterBoard18mm.netSqFt} Sq.Ft net + 10% wastage (${materials.sheets.shutterBoard18mm.grossSqFt} Sq.Ft gross)` },
    { 'Category': 'COMMERCIAL SHEET USAGE (8ft x 4ft)', 'Parameter': 'TOTAL CORE BOARD SHEETS (8x4)', 'Quantity': materials.sheets.totalCoreSheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': 'Combined Plywood & Substrate Sheets' },
    { 'Category': '', 'Parameter': '', 'Quantity': '', 'Unit': '', 'Notes': '' },
    { 'Category': 'LAMINATE & FINISH SHEETS (8ft x 4ft)', 'Parameter': '0.8mm Frosty White Inner Liner', 'Quantity': materials.laminates.innerLiner08mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.laminates.innerLiner08mm.netSqFt} Sq.Ft (2 faces carcass + shelves)` },
    { 'Category': 'LAMINATE & FINISH SHEETS (8ft x 4ft)', 'Parameter': '1.0mm/Acrylic Decorative Shutter Laminate', 'Quantity': materials.laminates.outerDecorative1mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.laminates.outerDecorative1mm.netSqFt} Sq.Ft outer door faces` },
    { 'Category': 'LAMINATE & FINISH SHEETS (8ft x 4ft)', 'Parameter': '0.8mm Shutter Balancing Backer', 'Quantity': materials.laminates.shutterBalancing08mm.sheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': `${materials.laminates.shutterBalancing08mm.netSqFt} Sq.Ft inner door faces` },
    { 'Category': 'LAMINATE & FINISH SHEETS (8ft x 4ft)', 'Parameter': 'TOTAL LAMINATE SHEETS (8x4)', 'Quantity': materials.laminates.totalLaminateSheets8x4, 'Unit': 'Sheets (8x4)', 'Notes': 'Total surface laminates required' },
    { 'Category': '', 'Parameter': '', 'Quantity': '', 'Unit': '', 'Notes': '' },
    { 'Category': 'EDGE BANDING / BINDING', 'Parameter': '0.8mm Carcass PVC Edge Band', 'Quantity': materials.edgeBanding.carcassEB08mm.grossMeters, 'Unit': 'Running Meters', 'Notes': `${materials.edgeBanding.carcassEB08mm.rolls50m} Rolls (50m each) incl 10% wastage` },
    { 'Category': 'EDGE BANDING / BINDING', 'Parameter': '2.0mm Shutter PVC Edge Band', 'Quantity': materials.edgeBanding.shutterEB20mm.grossMeters, 'Unit': 'Running Meters', 'Notes': `${materials.edgeBanding.shutterEB20mm.rolls50m} Rolls (50m each) incl 10% wastage` },
    { 'Category': 'EDGE BANDING / BINDING', 'Parameter': 'TOTAL EDGE BINDING RUNNING METERS', 'Quantity': materials.edgeBanding.totalRunningMeters, 'Unit': 'Running Meters', 'Notes': 'All panels combined' },
    { 'Category': '', 'Parameter': '', 'Quantity': '', 'Unit': '', 'Notes': '' },
    { 'Category': 'ADHESIVES & CONSUMABLES', 'Parameter': 'Fevicol Marine D3 / Laminate Adhesive', 'Quantity': materials.hardwareAndConsumables.fevicolGlueKg, 'Unit': 'Kg', 'Notes': 'Based on total laminate Sq.Ft' },
    { 'Category': 'ADHESIVES & CONSUMABLES', 'Parameter': 'Minifix Connectors & Bolts', 'Quantity': materials.hardwareAndConsumables.minifixSets, 'Unit': 'Sets', 'Notes': '16 sets per standard cabinet' },
    { 'Category': 'ADHESIVES & CONSUMABLES', 'Parameter': '50mm Confirmat Assembly Screws', 'Quantity': materials.hardwareAndConsumables.screws50mmNos, 'Unit': 'Nos', 'Notes': 'Carcass butt joints' },
    { 'Category': 'ADHESIVES & CONSUMABLES', 'Parameter': '16mm Star Screws (Hinges/Hardware)', 'Quantity': materials.hardwareAndConsumables.screws16mmNos, 'Unit': 'Nos', 'Notes': 'Fitting hardware' },
  ];
  const wsMaterial = XLSX.utils.json_to_sheet(materialSummaryData);
  XLSX.utils.book_append_sheet(wb, wsMaterial, 'Material & Sheet Summary');

  // 2. Unit-by-Unit Pieces Breakdown
  const unitPiecesData = materials.furnitureBreakdown.map((f, idx) => ({
    'Sr No': idx + 1,
    'Cabinet / Unit Name': f.furnitureName,
    'Category': f.category.toUpperCase(),
    'Dimensions (WxHxD mm)': f.dimensions,
    'Total Pieces': f.pieceCount,
    'Carcass Area (Sq.Ft)': f.carcassSqFt,
    'Shutter Area (Sq.Ft)': f.shutterSqFt,
    'Edge Banding (Running M)': f.edgeBandingMeters,
  }));
  const wsUnitPieces = XLSX.utils.json_to_sheet(unitPiecesData);
  XLSX.utils.book_append_sheet(wb, wsUnitPieces, 'Pieces Per Unit');

  // 3. MaxCut Cutting List Sheet
  const maxcutData = cuttingList.map((item, idx) => ({
    'Sr No': idx + 1,
    'Part Description': item.partName,
    'Parent Furniture': item.parentFurnitureName,
    'Category': item.category.toUpperCase(),
    'Quantity': item.qty,
    'Length (mm)': item.length,
    'Width (mm)': item.width,
    'Thickness (mm)': item.thickness,
    'Material': item.material,
    'Finish / Color': item.finish,
    'Edge Band Top (mm)': item.edgeBandingSides.top ? item.edgeBandingThickness : 0,
    'Edge Band Bottom (mm)': item.edgeBandingSides.bottom ? item.edgeBandingThickness : 0,
    'Edge Band Left (mm)': item.edgeBandingSides.left ? item.edgeBandingThickness : 0,
    'Edge Band Right (mm)': item.edgeBandingSides.right ? item.edgeBandingThickness : 0,
    'Grain Direction': item.grainDirection,
    'Remarks / CNC Notes': item.remarks || '-',
  }));
  const wsMaxcut = XLSX.utils.json_to_sheet(maxcutData);
  XLSX.utils.book_append_sheet(wb, wsMaxcut, 'MaxCut Panel List');

  // 4. Hardware Schedule Sheet
  const hardwareData = [
    { 'Hardware Item': 'Soft-Close Hinges (0 crank)', 'Specification': 'Auto 3D clip-on with damper', 'Total Qty': materials.hardwareAndConsumables.hingesPairs, 'Unit': 'Pairs' },
    { 'Hardware Item': 'Tandem Box Drawer Slides', 'Specification': '500mm Soft Close 35kg capacity', 'Total Qty': materials.hardwareAndConsumables.slidePairs, 'Unit': 'Pairs' },
    { 'Hardware Item': 'Handles / G-Profile Rails', 'Specification': 'Brush Black / Gold Edge Lip', 'Total Qty': materials.hardwareAndConsumables.handlesNos, 'Unit': 'Nos' },
    { 'Hardware Item': 'Adjustable Leveler Legs', 'Specification': '100mm PVC with Skirting Clips', 'Total Qty': materials.hardwareAndConsumables.legsNos, 'Unit': 'Nos' },
    { 'Hardware Item': 'Minifix Connectors & Dowels', 'Specification': '15mm Cam & 34mm Bolt', 'Total Qty': materials.hardwareAndConsumables.minifixSets, 'Unit': 'Sets' },
    { 'Hardware Item': 'Shelf Support Pins', 'Specification': '5mm Nickel Plated', 'Total Qty': materials.hardwareAndConsumables.shelfPinsNos, 'Unit': 'Nos' },
  ];
  const wsHardware = XLSX.utils.json_to_sheet(hardwareData);
  XLSX.utils.book_append_sheet(wb, wsHardware, 'Hardware Schedule');

  // 5. Project Quotation Sheet
  const quoteRows = [
    { 'Section': 'Project Name', 'Details': project.name, 'Cost (INR)': '' },
    { 'Section': 'Customer', 'Details': project.customerName, 'Cost (INR)': '' },
    { 'Section': 'Site Address', 'Details': project.siteAddress, 'Cost (INR)': '' },
    { 'Section': 'Room', 'Details': `${room.name} (${room.widthMm} x ${room.depthMm} mm)`, 'Cost (INR)': '' },
    { 'Section': '', 'Details': '', 'Cost (INR)': '' },
    { 'Section': 'Carcass Plywood Area', 'Details': `${quote.carcassAreaSqFt} Sq.Ft @ ₹160/sq.ft`, 'Cost (INR)': quote.carcassCost },
    { 'Section': 'Shutter Acrylic/Veneer Area', 'Details': `${quote.shutterAreaSqFt} Sq.Ft @ ₹310/sq.ft`, 'Cost (INR)': quote.shutterCost },
    { 'Section': 'Countertop Area', 'Details': `${quote.countertopAreaSqFt} Sq.Ft @ ₹420/sq.ft`, 'Cost (INR)': quote.countertopCost },
    { 'Section': 'PVC Edge Banding', 'Details': `${quote.edgeBandingMeters} Running Meters @ ₹45/m`, 'Cost (INR)': quote.edgeBandingCost },
    { 'Section': 'Hardware & Fittings', 'Details': 'Hinges, Slides, Handles, Levelers', 'Cost (INR)': quote.hardwareCost },
    { 'Section': 'Labor & Site Assembly', 'Details': '18% Factory machining & fitting', 'Cost (INR)': quote.laborCost },
    { 'Section': 'GRAND TOTAL ESTIMATE', 'Details': 'All inclusive modular interior production', 'Cost (INR)': quote.totalCost },
  ];
  const wsQuote = XLSX.utils.json_to_sheet(quoteRows);
  XLSX.utils.book_append_sheet(wb, wsQuote, 'Quotation & Estimate');

  // Trigger download
  const filename = `${project.name.replace(/\s+/g, '_')}_${room.name}_Cutting_List.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads a plain text, JSON, XML, or binary Blob file to client's browser.
 */
export function downloadFile(filename: string, content: string | Blob, mimeType: string = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

